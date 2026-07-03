/**
 * @file packages/core/src/domain/users/validators/users.ts
 * @layer core/domain
 * @description
 * Invariants métier des users (Studio) : validation email/name/rbac.
 * Domaine-only : pas de Zod/HTTP/UI.
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  User,
  UserRbac,
  UserRole,
  UserStatus,
} from "@compoz/core/domain/users/entities/user";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeString(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeLower(v: unknown): string {
  return normalizeString(v).toLowerCase();
}

function assertNonEmptyString(args: {
  value: unknown;
  code: ErrorCode;
  path: (string | number)[];
}): string {
  const v = normalizeString(args.value);
  if (!v) {
    throw new DomainError({
      code: args.code,
      message: args.code,
      details: { path: args.path },
    });
  }
  return v;
}

/** Validation email de base (domaine-only, pas RFC complète). */
function assertEmailFormat(emailLower: string, path: (string | number)[]) {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower);
  if (!ok) {
    throw new DomainError({
      code: EC.USER_EMAIL_INVALID_FORMAT,
      message: EC.USER_EMAIL_INVALID_FORMAT,
      details: { path, meta: { reason: "invalid_email_format" } },
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Public validators                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Email requis + normalisation lower-case + contrôle format.
 */
export function assertUserEmail(
  raw: unknown,
  path: (string | number)[] = ["email"],
): string {
  const emailLower = normalizeLower(
    assertNonEmptyString({
      value: raw,
      code: EC.USER_EMAIL_REQUIRED,
      path,
    }),
  );

  assertEmailFormat(emailLower, path);
  return emailLower;
}

/**
 * Name requis (trim).
 */
export function assertUserName(
  raw: unknown,
  path: (string | number)[] = ["name"],
): string {
  return assertNonEmptyString({
    value: raw,
    code: EC.USER_NAME_REQUIRED,
    path,
  });
}

/**
 * Rôle : admin | editor
 */
export function assertUserRole(
  raw: unknown,
  path: (string | number)[] = ["rbac", "role"],
): UserRole {
  const v = normalizeLower(raw);

  if (!v) {
    throw new DomainError({
      code: EC.USER_ROLE_REQUIRED,
      message: EC.USER_ROLE_REQUIRED,
      details: { path },
    });
  }

  if (v !== "admin" && v !== "editor") {
    throw new DomainError({
      code: EC.USER_ROLE_INVALID,
      message: EC.USER_ROLE_INVALID,
      details: { path, meta: { role: v } },
    });
  }

  return v as UserRole;
}

/**
 * tenantIds : array non vide, strings trim/lower, unique.
 */
export function assertTenantIds(
  raw: unknown,
  path: (string | number)[] = ["rbac", "tenantIds"],
): string[] {
  if (!Array.isArray(raw)) {
    throw new DomainError({
      code: EC.USER_TENANT_IDS_INVALID,
      message: EC.USER_TENANT_IDS_INVALID,
      details: { path, meta: { reason: "not_array" } },
    });
  }

  const tenantIds = Array.from(
    new Set(raw.map((t) => normalizeLower(t)).filter(Boolean)),
  );

  const wildcardIndex = tenantIds.indexOf("*");
  if (wildcardIndex >= 0) {
    throw new DomainError({
      code: EC.USER_TENANT_IDS_INVALID,
      message: EC.USER_TENANT_IDS_INVALID,
      details: {
        path: [...path, wildcardIndex],
        meta: { reason: "wildcard_not_allowed" },
      },
    });
  }

  if (tenantIds.length === 0) {
    throw new DomainError({
      code: EC.USER_TENANT_IDS_REQUIRED,
      message: EC.USER_TENANT_IDS_REQUIRED,
      details: { path },
    });
  }

  return tenantIds;
}

/**
 * defaultTenantId requis + normalisé + doit être dans tenantIds.
 */
export function assertDefaultTenantId(args: {
  defaultTenantId: unknown;
  tenantIds: ReadonlyArray<string>;
  path?: (string | number)[];
}): string {
  const {
    defaultTenantId,
    tenantIds,
    path = ["rbac", "defaultTenantId"],
  } = args;

  const v = assertNonEmptyString({
    value: defaultTenantId,
    code: EC.USER_DEFAULT_TENANT_REQUIRED,
    path,
  }).toLowerCase();

  if (!tenantIds.includes(v)) {
    throw new DomainError({
      code: EC.USER_DEFAULT_TENANT_NOT_ALLOWED,
      message: EC.USER_DEFAULT_TENANT_NOT_ALLOWED,
      details: {
        path,
        meta: {
          reason: "defaultTenantId_must_be_in_tenantIds",
          defaultTenantId: v,
        },
      },
    });
  }

  return v;
}

/**
 * RBAC complet.
 */
export function assertUserRbac(
  raw: unknown,
  path: (string | number)[] = ["rbac"],
): UserRbac {
  if (!raw || typeof raw !== "object") {
    throw new DomainError({
      code: EC.USER_RBAC_INVALID,
      message: EC.USER_RBAC_INVALID,
      details: { path },
    });
  }

  const r = raw as Record<string, unknown>;

  const role = assertUserRole(r["role"], [...path, "role"]);
  const tenantIds = assertTenantIds(r["tenantIds"], [...path, "tenantIds"]);
  const defaultTenantId = assertDefaultTenantId({
    defaultTenantId: r["defaultTenantId"],
    tenantIds,
    path: [...path, "defaultTenantId"],
  });

  return { role, tenantIds, defaultTenantId };
}

/**
 * Entité User complète.
 */
export function assertUser(u: User): void {
  assertNonEmptyString({
    value: u.id,
    code: EC.USER_ID_REQUIRED,
    path: ["user", "id"],
  });

  assertUserEmail(u.email, ["user", "email"]);
  assertUserName(u.name, ["user", "name"]);
  assertUserRbac(u.rbac, ["user", "rbac"]);
}

export function assertUserStatus(
  raw: unknown,
  path: (string | number)[] = ["status"],
): UserStatus {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!v) {
    throw new DomainError({
      code: EC.USER_STATUS_REQUIRED,
      message: EC.USER_STATUS_REQUIRED,
      details: { path },
    });
  }

  if (v !== "active" && v !== "disabled") {
    throw new DomainError({
      code: EC.USER_STATUS_INVALID,
      message: EC.USER_STATUS_INVALID,
      details: { path, meta: { status: v } },
    });
  }

  return v as UserStatus;
}
