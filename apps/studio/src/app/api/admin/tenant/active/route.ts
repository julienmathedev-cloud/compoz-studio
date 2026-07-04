/**
 * @file apps/studio/src/app/api/admin/tenant/active/route.ts
 * @layer studio/app/api
 *
 * @description
 * Définit le tenant / website actif dans Studio via cookie httpOnly.
 *
 * Payload: { tenantId?: string }
 *
 * Sécurité :
 * - nécessite session
 * - nécessite role=admin
 * - le website doit être accessible par l'utilisateur
 *
 * @remarks
 * - Cette route retourne une `NextResponse` afin de pouvoir définir un cookie httpOnly.
 * - Elle n'utilise pas `handleRoute()` (qui construit directement la réponse) tant que celui-ci
 *   ne permet pas d'enrichir la réponse (cookies/headers).
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { resolveStudioWebsite } from "@compoz/infra/websites/resolve-studio-website";
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { jsonOk } from "@compoz/studio/lib/api/responses";

const ACTIVE_TENANT_COOKIE = "compoz_active_tenant" as const;

type Payload = { tenantId?: string };

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeUniqueIds(input: ReadonlyArray<unknown>): string[] {
  return [...new Set(input.map(normalizeId).filter(Boolean))];
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  const { tenantIds, defaultTenantId, role, user } = session;

  const body = (await readJsonOr400(req)) as Payload;

  const tenantId = normalizeId(body.tenantId);

  if (!tenantId) {
    throwHttp(422, {
      code: EC.VALIDATION_ERROR,
      message: "Missing tenantId",
      where: "api.studio.tenant.active.payload.tenantId",
    });
  }

  const allowedWebsiteIds = normalizeUniqueIds(tenantIds ?? []);
  const defaultWebsiteId = normalizeId(defaultTenantId);

  const website = await resolveStudioWebsite({
    activeWebsiteId: tenantId,
    user: {
      id: user.id,
      role,
      defaultWebsiteId,
      accessibleWebsiteIds: allowedWebsiteIds,
    },
  }).catch((error: unknown) => {
    throwHttp(403, {
      code: EC.FORBIDDEN,
      message: "Website not allowed",
      where: "api.studio.tenant.active.tenantId",
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  if (website.source !== "cookie" || website.websiteId !== tenantId) {
    throwHttp(403, {
      code: EC.FORBIDDEN,
      message: "Website not allowed",
      where: "api.studio.tenant.active.tenantId",
      tenantId,
    });
  }

  const res = jsonOk(
    {
      ok: true,
      tenantId: website.websiteId,
      websiteId: website.websiteId,
      websiteSlug: website.slug,
      websiteName: website.name,
      defaultTenantId: defaultWebsiteId || website.websiteId,
    },
    200,
  );

  res.cookies.set(ACTIVE_TENANT_COOKIE, website.websiteId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
