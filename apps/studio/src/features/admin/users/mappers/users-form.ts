/**
 * @file apps/studio/src/features/admin/users/mappers/users-form.ts
 * @layer ui-mappers/studio/users
 *
 * @description
 * Mappers formulaire Studio pour les users.
 *
 * @remarks
 * Responsabilités :
 * - Normalisations UI simples : trim, lowercase email, coercitions.
 * - Construction des Intent DTO pour l’API Studio.
 * - Users = Studio-only, pas de mapper shared runtime.
 * - Le password n'est jamais renvoyé depuis l’API.
 * - Les droits RBAC sont exprimés en Prisma Website.id.
 */

import type { UserDTO } from "@compoz/core/domain/users/dto";
import type { UserFormValues } from "@compoz/validation/users/user-form";
import type {
  CreateUserIntentDTO,
  UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

/* -------------------------------------------------------------------------- */
/* Defaults UI                                                                */
/* -------------------------------------------------------------------------- */

const DEFAULT_RBAC: UserFormValues["rbac"] = {
  role: "editor",
  websiteIds: ["default"],
  defaultWebsiteId: "default",
};

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function normalizeWebsiteId(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

/** Normalise une liste de Website.id. */
function normalizeWebsiteIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : [];

  const websiteIds = raw
    .map(normalizeWebsiteId)
    .filter((websiteId): websiteId is string => Boolean(websiteId));

  return websiteIds.length > 0 ? websiteIds : DEFAULT_RBAC.websiteIds;
}

/** Normalise un email. */
function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

/** Normalise un nom. */
function normalizeName(input: unknown): string {
  return String(input ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/* Domain DTO -> UI form values                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* UI form values normalization                                               */
/* -------------------------------------------------------------------------- */

export function normalizeUserFormValues(
  values: UserFormValues,
): UserFormValues {
  return {
    ...(values.id ? { id: String(values.id).trim() } : {}),
    email: normalizeEmail(values.email),
    name: normalizeName(values.name),
    /**
     * On ne trim pas ici pour éviter de surprendre l’UI.
     * Le trim du password est fait au submit.
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

/* -------------------------------------------------------------------------- */
/* UI -> intents API Studio                                                   */
/* -------------------------------------------------------------------------- */

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
   * Password optionnel :
   * - chaîne vide = no change.
   * - chaîne non vide = update password.
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
