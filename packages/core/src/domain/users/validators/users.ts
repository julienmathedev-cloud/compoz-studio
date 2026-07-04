/**
 * @file packages/core/src/domain/users/validators/users.ts
 * @layer core/domain
 *
 * @description
 * Invariants métier des users Studio : validation email/name/rbac.
 *
 * @remarks
 * Domaine-only : pas de Zod / HTTP / UI.
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

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

function assertNonEmptyString(args: {
  value: unknown;
  code: ErrorCode;
  path: (string | number)[];
}): string {
  const value = normalizeString(args.value);

  if (!value) {
    throw new DomainError({
      code: args.code,
      message: args.code,
      details: { path: args.path },
    });
  }

  return value;
}

/**
 * Validation email de base domaine-only, pas RFC complète.
 */
function assertEmailFormat(emailLower: string, path: (string | number)[]) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower);

  if (!isValid) {
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
 * Name requis, trim.
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
 * Rôle : admin | editor.
 */
export function assertUserRole(
  raw: unknown,
  path: (string | number)[] = ["rbac", "role"],
): UserRole {
  const value = normalizeLower(raw);

  if (!value) {
    throw new DomainError({
      code: EC.USER_ROLE_REQUIRED,
      message: EC.USER_ROLE_REQUIRED,
      details: { path },
    });
  }

  if (value !== "admin" && value !== "editor") {
    throw new DomainError({
      code: EC.USER_ROLE_INVALID,
      message: EC.USER_ROLE_INVALID,
      details: { path, meta: { role: value } },
    });
  }

  return value as UserRole;
}

/**
 * websiteIds : array non vide, strings trim/lower, unique.
 */
export function assertWebsiteIds(
  raw: unknown,
  path: (string | number)[] = ["rbac", "websiteIds"],
): string[] {
  if (!Array.isArray(raw)) {
    throw new DomainError({
      code: EC.USER_WEBSITE_IDS_INVALID,
      message: EC.USER_WEBSITE_IDS_INVALID,
      details: { path, meta: { reason: "not_array" } },
    });
  }

  const websiteIds = Array.from(
    new Set(raw.map((websiteId) => normalizeLower(websiteId)).filter(Boolean)),
  );

  const wildcardIndex = websiteIds.indexOf("*");

  if (wildcardIndex >= 0) {
    throw new DomainError({
      code: EC.USER_WEBSITE_IDS_INVALID,
      message: EC.USER_WEBSITE_IDS_INVALID,
      details: {
        path: [...path, wildcardIndex],
        meta: { reason: "wildcard_not_allowed" },
      },
    });
  }

  if (websiteIds.length === 0) {
    throw new DomainError({
      code: EC.USER_WEBSITE_IDS_REQUIRED,
      message: EC.USER_WEBSITE_IDS_REQUIRED,
      details: { path },
    });
  }

  return websiteIds;
}

/**
 * defaultWebsiteId requis + normalisé + doit être dans websiteIds.
 */
export function assertDefaultWebsiteId(args: {
  defaultWebsiteId: unknown;
  websiteIds: ReadonlyArray<string>;
  path?: (string | number)[];
}): string {
  const {
    defaultWebsiteId,
    websiteIds,
    path = ["rbac", "defaultWebsiteId"],
  } = args;

  const value = assertNonEmptyString({
    value: defaultWebsiteId,
    code: EC.USER_DEFAULT_WEBSITE_REQUIRED,
    path,
  }).toLowerCase();

  if (!websiteIds.includes(value)) {
    throw new DomainError({
      code: EC.USER_DEFAULT_WEBSITE_NOT_ALLOWED,
      message: EC.USER_DEFAULT_WEBSITE_NOT_ALLOWED,
      details: {
        path,
        meta: {
          reason: "defaultWebsiteId_must_be_in_websiteIds",
          defaultWebsiteId: value,
        },
      },
    });
  }

  return value;
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

  const record = raw as Record<string, unknown>;

  const role = assertUserRole(record["role"], [...path, "role"]);
  const websiteIds = assertWebsiteIds(record["websiteIds"], [
    ...path,
    "websiteIds",
  ]);
  const defaultWebsiteId = assertDefaultWebsiteId({
    defaultWebsiteId: record["defaultWebsiteId"],
    websiteIds,
    path: [...path, "defaultWebsiteId"],
  });

  return { role, websiteIds, defaultWebsiteId };
}

/**
 * Entité User complète.
 */
export function assertUser(user: User): void {
  assertNonEmptyString({
    value: user.id,
    code: EC.USER_ID_REQUIRED,
    path: ["user", "id"],
  });

  assertUserEmail(user.email, ["user", "email"]);
  assertUserName(user.name, ["user", "name"]);
  assertUserRbac(user.rbac, ["user", "rbac"]);
}

export function assertUserStatus(
  raw: unknown,
  path: (string | number)[] = ["status"],
): UserStatus {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (!value) {
    throw new DomainError({
      code: EC.USER_STATUS_REQUIRED,
      message: EC.USER_STATUS_REQUIRED,
      details: { path },
    });
  }

  if (value !== "active" && value !== "disabled") {
    throw new DomainError({
      code: EC.USER_STATUS_INVALID,
      message: EC.USER_STATUS_INVALID,
      details: { path, meta: { status: value } },
    });
  }

  return value as UserStatus;
}
