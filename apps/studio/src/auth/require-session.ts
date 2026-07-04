/**
 * @file apps/studio/src/auth/require-session.ts
 * @layer studio/auth
 *
 * @description
 * Helpers d'auth pour les routes API et pages server Studio :
 * - centralise `auth()`
 * - résout le tenantId / websiteId actif
 * - expose un sous-objet user minimal (id/email) pour les pages server
 * - expose aussi les métadonnées utiles des sessions sandbox démo
 * - lève des erreurs HTTP standardisées via `throwHttp`
 */

import "server-only";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import { resolveStudioWebsite } from "@compoz/infra/websites/resolve-studio-website";
import { authOptions } from "@compoz/studio/auth/auth";

const ACTIVE_TENANT_COOKIE = "compoz_active_tenant" as const;

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

export type SessionTenantResult = Readonly<{
  /**
   * Legacy name kept for compatibility with existing Studio callers.
   * For regular Prisma websites, this is equal to websiteId.
   * For demo sandbox sessions, this can still be the KV sandbox tenant id.
   */
  tenantId: string;

  /**
   * Prisma Website id for regular websites.
   * For demo sandbox sessions, this currently mirrors tenantId until sandbox
   * storage is migrated to Prisma.
   */
  websiteId: string;

  websiteSlug: string;
  websiteName: string;
  websiteSource: WebsiteSource | "demo-session";

  role: string;
  tenantIds?: string[];
  defaultTenantId?: string;

  /**
   * Sous-ensemble minimal pour UI server (ex: bloquer self-delete).
   * NB: dépend des callbacks NextAuth (jwt/session) pour exposer ces champs.
   */
  user: SessionUserLite;
}>;

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

function assertNoWildcardTenantAccess(args: {
  defaultTenantId: string;
  tenantIds: ReadonlyArray<string>;
}): void {
  if (args.defaultTenantId === "*" || args.tenantIds.includes("*")) {
    throwHttp(400, {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Wildcard tenant access is not supported",
      where: "auth.session.tenantIds",
    });
  }
}

/**
 * Résout la session Studio + tenant / website actif.
 *
 * @remarks
 * - Retourne `null` si aucune session n'est présente.
 * - Lance une erreur si la session existe mais est invalide/incomplète.
 * - Utile pour les pages server qui veulent rediriger vers signin
 *   au lieu de lever directement une 401 HTTP.
 */
export async function getSessionWithTenantOrNull(): Promise<SessionTenantResult | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const role = normalizeId(session.user?.role);
  const defaultTenantId = normalizeId(session.user?.defaultTenantId);

  const tenantIds = Array.isArray(session.user?.tenantIds)
    ? normalizeUniqueIds(session.user.tenantIds as unknown[])
    : [];

  assertNoWildcardTenantAccess({
    defaultTenantId,
    tenantIds,
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

  /**
   * Keep demo sandbox sessions on the legacy KV tenant id for now.
   *
   * Sandbox storage is intentionally not migrated to Prisma yet, so demo
   * sessions must not be resolved through the Prisma Website resolver.
   */
  if (isDemoSessionUser(user)) {
    const demoInstanceId = normalizeOptionalString(user.demoInstanceId);

    if (!demoInstanceId) {
      throwHttp(401, {
        code: ERROR_CODES.UNAUTHORIZED,
        message: ERROR_CODES.UNAUTHORIZED,
        extras: {
          where: "auth.session.user.demoInstanceId",
          reason: "INVALID_DEMO_SESSION",
        },
      });
    }

    return {
      tenantId: demoInstanceId,
      websiteId: demoInstanceId,
      websiteSlug: demoInstanceId,
      websiteName: "Demo sandbox",
      websiteSource: "demo-session",
      role,
      tenantIds,
      defaultTenantId: defaultTenantId || demoInstanceId,
      user,
    };
  }

  const c = await cookies();
  const activeWebsiteId = normalizeId(c.get(ACTIVE_TENANT_COOKIE)?.value);

  const website = await resolveStudioWebsite({
    activeWebsiteId,
    user: {
      id: user.id,
      role,
      defaultWebsiteId: defaultTenantId,
      accessibleWebsiteIds: tenantIds,
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
    tenantId: website.websiteId,
    websiteId: website.websiteId,
    websiteSlug: website.slug,
    websiteName: website.name,
    websiteSource: website.source,
    role,
    tenantIds,
    defaultTenantId: defaultTenantId || website.websiteId,
    user,
  };
}

export async function requireSessionWithTenant(): Promise<SessionTenantResult> {
  const session = await getSessionWithTenantOrNull();

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
export async function requireNonDemoSession(): Promise<SessionTenantResult> {
  const session = await requireSessionWithTenant();

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
 * Exige une session + rôle admin.
 */
export async function requireAdminSession(): Promise<SessionTenantResult> {
  const session = await requireSessionWithTenant();

  if (!isAdminRole(session.role)) {
    throwHttp(403, {
      code: ERROR_CODES.FORBIDDEN,
      message: ERROR_CODES.FORBIDDEN,
    });
  }

  return session;
}
