/**
 * @file apps/studio/src/app/api/admin/tenant/active/route.ts
 * @layer studio/app/api
 *
 * @description
 * Définit le tenant "actif" dans Studio via cookie httpOnly.
 *
 * Payload: { tenantId?: string }
 *
 * Sécurité :
 * - nécessite session
 * - nécessite role=admin
 * - le tenant doit être dans session.user.tenantIds
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
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { jsonOk } from "@compoz/studio/lib/api/responses";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

const ACTIVE_TENANT_COOKIE = "compoz_active_tenant" as const;

type Payload = { tenantId?: string };

export async function POST(req: Request) {
  const session = await requireAdminSession();
  const { tenantIds, defaultTenantId } = session;

  const body = (await readJsonOr400(req)) as Payload;

  const tenantId = toTenantId(body.tenantId);
  if (!tenantId) {
    throwHttp(422, {
      code: EC.VALIDATION_ERROR,
      message: "Missing tenantId",
      where: "api.studio.tenant.active.payload.tenantId",
    });
  }

  const allowed = (tenantIds ?? [])
    .map(toTenantId)
    .filter((x): x is string => typeof x === "string" && x.length > 0);

  const hasWildcard = allowed.includes("*");

  if (!hasWildcard && !allowed.includes(tenantId)) {
    throwHttp(403, {
      code: EC.FORBIDDEN,
      message: "Tenant not allowed",
      where: "api.studio.tenant.active.tenantId",
      tenantId,
    });
  }

  const res = jsonOk(
    {
      ok: true,
      tenantId,
      defaultTenantId: toTenantId(defaultTenantId),
    },
    200,
  );

  res.cookies.set(ACTIVE_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
