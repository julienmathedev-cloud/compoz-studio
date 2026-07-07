/**
 * @file packages/ui/src/users/mappers/user-shape.ts
 * @layer ui/users/mappers
 *
 * @description
 * Maps user DTOs to stable form-backed UI shapes used by the Studio.
 *
 * @remarks
 * This mapper stays at the shared UI boundary: it does not handle API intents, business rules, uniqueness, or RBAC authorization.
 */

import type { UserDTO } from "@compoz/core/domain/users/dto";
import type { UserFormValues } from "@compoz/validation/users/user-form";

const DEFAULT_RBAC: UserFormValues["rbac"] = {
  role: "editor",
  websiteIds: [],
  defaultWebsiteId: "",
};

function toTrimmedString(value: unknown): string {
  return String(value ?? "").trim();
}

function toOptionalId(value: unknown): string | undefined {
  const normalized = toTrimmedString(value);

  return normalized.length > 0 ? normalized : undefined;
}

function toLowerEmail(value: unknown): string {
  return toTrimmedString(value).toLowerCase();
}

function toRbacRole(value: unknown): UserFormValues["rbac"]["role"] {
  // Dirty DTO values fall back to the default role instead of leaking invalid RBAC states into the form.
  if (typeof value !== "string") {
    return DEFAULT_RBAC.role;
  }

  const role = value.trim();

  return (role || DEFAULT_RBAC.role) as UserFormValues["rbac"]["role"];
}

function toWebsiteIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toTrimmedString(item)).filter(Boolean);
}

/**
 * Converts a user DTO into a stable UI form shape.
 *
 * @remarks
 * `password` is always reset to an empty string so credential hashes or secrets are never exposed to the UI.
 */
export function toUserShapeFromDTO(
  user: UserDTO | null | undefined,
): UserFormValues {
  if (!user) {
    return {
      id: undefined,
      email: "",
      name: "",
      password: "",
      rbac: {
        ...DEFAULT_RBAC,
        websiteIds: [],
      },
    };
  }

  return {
    id: toOptionalId(user.id),
    email: toLowerEmail(user.email),
    name: toTrimmedString(user.name),
    password: "",

    rbac: {
      role: toRbacRole(user.rbac?.role),
      websiteIds: toWebsiteIds(user.rbac?.websiteIds),
      defaultWebsiteId: toTrimmedString(
        user.rbac?.defaultWebsiteId ?? DEFAULT_RBAC.defaultWebsiteId,
      ),
    },
  };
}
