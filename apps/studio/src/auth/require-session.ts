/**
 * @file apps/studio/src/auth/require-session.ts
 * @layer studio/auth
 *
 * @description
 * Helpers d'auth pour les routes API et pages server Studio.
 *
 * @remarks
 * Responsabilités :
 * - Centralise `auth()`.
 * - Résout le Website actif.
 * - Expose un sous-objet user minimal pour les pages server.
 * - Expose les métadonnées utiles des sessions sandbox démo.
 * - Lève des erreurs HTTP standardisées via `throwHttp`.
 *
 * Notes de scope :
 * - Les sessions Studio sont scopées par Prisma Website.id.
 * - Les routes publiques `/t/:websiteSlug` utilisent Website.slug ailleurs.
 */

import "server-only";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { HttpErrorBody } from "@compoz/http/http-error";
import { isUnknownObject, throwHttp } from "@compoz/http/http-error";
import { resolveStudioWebsite } from "@compoz/infra/websites/resolve-studio-website";
import { authOptions } from "@compoz/studio/auth/auth";
import { ACTIVE_WEBSITE_COOKIE } from "@compoz/studio/auth/session-cookies";

type WebsiteSource =
  | "cookie"
  | "user-default"
  | "first-accessible"
  | "fallback";

export function isAdminRole(role: unknown): boolean {
  return (
    String(role ?? "")
      .trim()
      .toLowerCase() === "admin"
  );
}

export function isDemoSessionUser(user: {
  isDemo?: boolean;
  demoInstanceId?: string;
}): boolean {
  return (
    user.isDemo === true && Boolean(String(user.demoInstanceId ?? "").trim())
  );
}

type SessionUserLite = Readonly<{
  id: string;
  email: string;
  isDemo?: boolean;
  demoInstanceId?: string;
  demoExpiresAt?: string;
}>;

export type SessionWebsiteResult = Readonly<{
  /**
   * Prisma Website.id du Website actif.
   *
   * Les sessions démo suivent le même flow que les sessions Studio classiques :
   * elles pointent vers un vrai Website Prisma de type sandbox.
   */
  websiteId: string;

  /**
   * Website.slug utilisé pour les URLs publiques fallback `/t/:websiteSlug`
   * et pour certaines résolutions UI/skin.
   */
  websiteSlug: string;

  websiteName: string;
  websiteSource: WebsiteSource;

  role: string;
  websiteIds: string[];
  defaultWebsiteId: string;

  /**
   * Sous-ensemble minimal pour UI server.
   *
   * Exemple : bloquer un self-delete côté admin.
   */
  user: SessionUserLite;
}>;

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : undefined;
}

function normalizeUniqueIds(input: ReadonlyArray<unknown>): string[] {
  return [...new Set(input.map(normalizeId).filter(Boolean))];
}

function assertNoWildcardWebsiteAccess(args: {
  defaultWebsiteId: string;
  websiteIds: ReadonlyArray<string>;
}): void {
  if (args.defaultWebsiteId === "*" || args.websiteIds.includes("*")) {
    throwHttp(400, {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Wildcard website access is not supported",
      where: "auth.session.websiteIds",
    });
  }
}

function isHttpErrorBody(value: unknown): value is HttpErrorBody {
  return isUnknownObject(value) && typeof value["code"] === "string";
}

export function isStaleWebsiteSessionError(error: unknown): boolean {
  if (!isUnknownObject(error)) return false;

  const http = error["__http__"];
  if (!isUnknownObject(http)) return false;

  const status = http["status"];
  const body = http["body"];

  if (status !== 403 || !isHttpErrorBody(body)) return false;

  const extras = body["extras"];
  if (!isUnknownObject(extras)) return false;

  return (
    extras["where"] === "auth.session.website" &&
    extras["reason"] === "WEBSITE_NOT_ALLOWED"
  );
}

/* -------------------------------------------------------------------------- */
/* Session resolution                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Résout la session Studio + Website actif.
 *
 * @remarks
 * - Retourne `null` si aucune session n'est présente.
 * - Lance une erreur si la session existe mais est invalide/incomplète.
 * - Utile pour les pages server qui veulent rediriger vers signin
 *   au lieu de lever directement une 401 HTTP.
 */
export async function getSessionWithWebsiteOrNull(): Promise<SessionWebsiteResult | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const role = normalizeId(session.user?.role);
  const defaultWebsiteId = normalizeId(session.user?.defaultWebsiteId);

  const websiteIds = Array.isArray(session.user?.websiteIds)
    ? normalizeUniqueIds(session.user.websiteIds as unknown[])
    : [];

  assertNoWildcardWebsiteAccess({
    defaultWebsiteId,
    websiteIds,
  });

  const user: SessionUserLite = {
    id: normalizeId(session.user?.id),
    email: normalizeEmail(session.user?.email),
    isDemo:
      typeof session.user?.isDemo === "boolean"
        ? session.user.isDemo
        : undefined,
    demoInstanceId: normalizeOptionalString(session.user?.demoInstanceId),
    demoExpiresAt: normalizeOptionalString(session.user?.demoExpiresAt),
  };

  if (!user.id || !user.email) {
    throwHttp(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: ERROR_CODES.UNAUTHORIZED,
      extras: {
        where: "auth.session.user",
        reason: "INVALID_SESSION_USER",
      },
    });
  }

  const cookieStore = await cookies();
  const activeWebsiteId = normalizeId(
    cookieStore.get(ACTIVE_WEBSITE_COOKIE)?.value,
  );

  const website = await resolveStudioWebsite({
    activeWebsiteId,
    user: {
      id: user.id,
      role,
      defaultWebsiteId,
      accessibleWebsiteIds: websiteIds,
    },
  }).catch((error: unknown) => {
    throwHttp(403, {
      code: ERROR_CODES.FORBIDDEN,
      message: ERROR_CODES.FORBIDDEN,
      extras: {
        where: "auth.session.website",
        reason: "WEBSITE_NOT_ALLOWED",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  });

  return {
    websiteId: website.websiteId,
    websiteSlug: website.slug,
    websiteName: website.name,
    websiteSource: website.source,
    role,
    websiteIds,
    defaultWebsiteId: defaultWebsiteId || website.websiteId,
    user,
  };
}

export async function requireSessionWithWebsite(): Promise<SessionWebsiteResult> {
  const session = await getSessionWithWebsiteOrNull();

  if (!session) {
    throwHttp(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: ERROR_CODES.UNAUTHORIZED,
    });
  }

  return session;
}

/**
 * Exige une session active qui n'est pas une session démo.
 */
export async function requireNonDemoSession(): Promise<SessionWebsiteResult> {
  const session = await requireSessionWithWebsite();

  if (isDemoSessionUser(session.user)) {
    throwHttp(403, {
      code: ERROR_CODES.FORBIDDEN,
      message: ERROR_CODES.FORBIDDEN,
      extras: {
        where: "auth.session.user.isDemo",
        reason: "DEMO_SESSION_FORBIDDEN",
      },
    });
  }

  return session;
}

/**
 * Exige une session active avec rôle admin.
 */
export async function requireAdminSession(): Promise<SessionWebsiteResult> {
  const session = await requireSessionWithWebsite();

  if (!isAdminRole(session.role)) {
    throwHttp(403, {
      code: ERROR_CODES.FORBIDDEN,
      message: ERROR_CODES.FORBIDDEN,
    });
  }

  return session;
}
