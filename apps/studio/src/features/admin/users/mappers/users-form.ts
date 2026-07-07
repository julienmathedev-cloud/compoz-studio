/**
 * @file apps/studio/src/features/admin/users/mappers/users-form.ts
 * @layer studio/features/admin/users/mappers
 *
 * @description
 * Studio user form mappers for UI values, domain DTOs, and API intent DTOs.
 *
 * @remarks
 * - Applies simple UI normalization such as trimming, lowercasing email values, and coercions.
 * - Users are Studio-only data, so no shared runtime mapper is involved.
 * - Passwords are never returned by the API and are only sent when explicitly provided.
 * - RBAC access is expressed with Prisma Website.id values.
 */

import type { UserDTO } from "@compoz/core/domain/users/dto";
import type { UserFormValues } from "@compoz/validation/users/user-form";
import type {
  CreateUserIntentDTO,
  UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

// UI defaults.

const DEFAULT_RBAC: UserFormValues["rbac"] = {
  role: "editor",
  websiteIds: ["default"],
  defaultWebsiteId: "default",
};

// (normalizers section removed decorative comment)

function normalizeWebsiteId(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeWebsiteIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : [];

  const websiteIds = raw
    .map(normalizeWebsiteId)
    .filter((websiteId): websiteId is string => Boolean(websiteId));

  return websiteIds.length > 0 ? websiteIds : DEFAULT_RBAC.websiteIds;
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeName(input: unknown): string {
  return String(input ?? "").trim();
}

// Domain DTO to UI form values.

export function toUserFormValuesFromDTO(
  user: UserDTO | null | undefined,
): UserFormValues {
  if (!user) {
    return {
      email: "",
      name: "",
      password: "",
      rbac: DEFAULT_RBAC,
    };
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.name ?? "",
    password: "",
    rbac: {
      role: user.rbac?.role ?? DEFAULT_RBAC.role,
      websiteIds: normalizeWebsiteIds(user.rbac?.websiteIds),
      defaultWebsiteId:
        normalizeWebsiteId(user.rbac?.defaultWebsiteId) ||
        DEFAULT_RBAC.defaultWebsiteId,
    },
  };
}

// UI form values normalization.

export function normalizeUserFormValues(
  values: UserFormValues,
): UserFormValues {
  return {
    ...(values.id ? { id: String(values.id).trim() } : {}),
    email: normalizeEmail(values.email),
    name: normalizeName(values.name),
    /**
     * Keep the password draft untouched while editing; trimming happens on submit.
     */
    password: String(values.password ?? ""),
    rbac: {
      role: values.rbac?.role ?? DEFAULT_RBAC.role,
      websiteIds: normalizeWebsiteIds(values.rbac?.websiteIds),
      defaultWebsiteId:
        normalizeWebsiteId(values.rbac?.defaultWebsiteId) ||
        DEFAULT_RBAC.defaultWebsiteId,
    },
  };
}

// UI form values to Studio API intents.

export function toCreateUserIntentDTOFromFormValues(
  values: UserFormValues,
): CreateUserIntentDTO {
  const normalized = normalizeUserFormValues(values);

  return {
    email: normalized.email,
    name: normalized.name,
    password: String(normalized.password ?? "").trim(),
    rbac: normalized.rbac,
  };
}

export function toUpdateUserIntentDTOFromFormValues(
  values: Partial<UserFormValues>,
): UpdateUserIntentDTO {
  const out: UpdateUserIntentDTO = {};

  if ("email" in values && values.email !== undefined) {
    out.email = normalizeEmail(values.email);
  }

  if ("name" in values && values.name !== undefined) {
    out.name = normalizeName(values.name);
  }

  /**
   * Empty password means no change; non-empty password updates the password.
   */
  if ("password" in values && typeof values.password === "string") {
    const password = values.password.trim();

    if (password.length > 0) {
      out.password = password;
    }
  }

  if ("rbac" in values && values.rbac !== undefined) {
    out.rbac = {
      role: values.rbac?.role ?? DEFAULT_RBAC.role,
      websiteIds: normalizeWebsiteIds(values.rbac?.websiteIds),
      defaultWebsiteId:
        normalizeWebsiteId(values.rbac?.defaultWebsiteId) ||
        DEFAULT_RBAC.defaultWebsiteId,
    };
  }

  return out;
}
