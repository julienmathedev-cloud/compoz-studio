/**
 * @file apps/studio/src/auth/require-session.ts
 * @layer studio/auth
 *
 * @description
 * Helpers d'auth pour les routes API Studio :
 * - centralise `auth()`
 * - résout le tenantId "actif" (session + cookie admin)
 * - expose un sous-objet user minimal (id/email) pour les pages server
 * - lève des erreurs HTTP standardisées via `throwHttp`
 */

import "server-only";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import { authOptions } from "@compoz/studio/auth/auth";

const ACTIVE_TENANT_COOKIE = "compoz_active_tenant" as const;

export function isAdminRole(role: unknown): boolean {
  return (
    String(role ?? "")
      .trim()
      .toLowerCase() === "admin"
  );
}

type SessionUserLite = Readonly<{
  id: string;
  email: string;
}>;

export type SessionTenantResult = Readonly<{
  tenantId: string;
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

export async function requireSessionWithTenant(): Promise<SessionTenantResult> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throwHttp(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: ERROR_CODES.UNAUTHORIZED,
    });
  }

  const defaultTenantId = String(session.user?.defaultTenantId ?? "")
    .trim()
    .toLowerCase();

  if (!defaultTenantId) {
    throwHttp(400, {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Missing tenant",
      where: "auth.session.defaultTenantId",
    });
  }

  const role = String(session.user?.role ?? "").trim();

  const tenantIds = Array.isArray(session.user?.tenantIds)
    ? (session.user.tenantIds as unknown[]).map((t) =>
        String(t ?? "")
          .trim()
          .toLowerCase(),
      )
    : [];

  const user: SessionUserLite = {
    id: normalizeId(session.user.id),
    email: normalizeEmail(session.user?.email),
  };

  // ✅ Non-admin : tenant fixé
  if (!isAdminRole(role)) {
    return {
      tenantId: defaultTenantId,
      role,
      tenantIds,
      defaultTenantId,
      user,
    };
  }

  // ✅ Admin : cookie "tenant actif" si valide
  const c = await cookies();
  const active = String(c.get(ACTIVE_TENANT_COOKIE)?.value ?? "")
    .trim()
    .toLowerCase();

  const hasWildcard = tenantIds.includes("*");

  const tenantId =
    active && (hasWildcard || tenantIds.includes(active))
      ? active
      : defaultTenantId;

  return { tenantId, role, tenantIds, defaultTenantId, user };
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
