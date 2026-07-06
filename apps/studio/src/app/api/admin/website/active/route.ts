/**
 * @file apps/studio/src/app/api/admin/website/active/route.ts
 * @layer studio/app/api
 *
 * @description
 * Définit le Website actif dans le Studio via un cookie httpOnly.
 *
 * @remarks
 * Payload attendu :
 * - `{ websiteId: string }`
 *
 * Sécurité :
 * - nécessite une session authentifiée,
 * - nécessite le rôle admin,
 * - le Website demandé doit être accessible par l'utilisateur.
 *
 * Cette route retourne une `NextResponse` afin de pouvoir définir un cookie httpOnly.
 * Elle n'utilise pas `handleRoute()` tant que celui-ci ne permet pas d'enrichir
 * la réponse avec des cookies ou headers.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { resolveStudioWebsite } from "@compoz/infra/websites/resolve-studio-website";
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import {
  ACTIVE_WEBSITE_COOKIE,
  STUDIO_SESSION_MAX_AGE_SECONDS,
} from "@compoz/studio/auth/session-cookies";
import { jsonOk } from "@compoz/studio/lib/api/responses";

type Payload = Readonly<{
  websiteId?: string;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeUniqueWebsiteIds(input: ReadonlyArray<unknown>): string[] {
  return [...new Set(input.map(normalizeWebsiteId).filter(Boolean))];
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  const session = await requireAdminSession();
  const { websiteIds, defaultWebsiteId, role, user } = session;

  const body = (await readJsonOr400(req)) as Payload;

  const websiteId = normalizeWebsiteId(body.websiteId);

  if (!websiteId) {
    throwHttp(422, {
      code: EC.VALIDATION_ERROR,
      message: "Missing websiteId",
      where: "api.studio.website.active.payload.websiteId",
    });
  }

  const accessibleWebsiteIds = normalizeUniqueWebsiteIds(websiteIds);
  const normalizedDefaultWebsiteId = normalizeWebsiteId(defaultWebsiteId);

  const website = await resolveStudioWebsite({
    activeWebsiteId: websiteId,
    user: {
      id: user.id,
      role,
      defaultWebsiteId: normalizedDefaultWebsiteId,
      accessibleWebsiteIds,
    },
  }).catch((error: unknown) => {
    throwHttp(403, {
      code: EC.FORBIDDEN,
      message: "Website not allowed",
      where: "api.studio.website.active.websiteId",
      websiteId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  if (website.source !== "cookie" || website.websiteId !== websiteId) {
    throwHttp(403, {
      code: EC.FORBIDDEN,
      message: "Website not allowed",
      where: "api.studio.website.active.websiteId",
      websiteId,
    });
  }

  const res = jsonOk(
    {
      ok: true,
      websiteId: website.websiteId,
      websiteSlug: website.slug,
      websiteName: website.name,
      defaultWebsiteId: normalizedDefaultWebsiteId || website.websiteId,
    },
    200,
  );

  res.cookies.set(ACTIVE_WEBSITE_COOKIE, website.websiteId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDIO_SESSION_MAX_AGE_SECONDS,
  });

  return res;
}
