/**
 * @file apps/studio/src/features/admin/users/mappers/users-form.ts
 * @layer ui-mappers/studio/users
 *
 * @description
 * Mappers "forms studio" pour les users :
 * - normalisations UI (trim/coercitions simples)
 * - construction des Intent DTO pour l’API Studio
 *
 * @remarks
 * - Users = Studio-only (pas de mapper shared runtime).
 * - Le password n'est jamais renvoyé depuis l’API.
 */

import { toTenantId } from "@compoz/ui/lib/tenant-id";

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
  tenantIds: ["default"],
  defaultTenantId: "default",
};

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

/** Normalise une liste de tenantIds (trim + lowercase + filter). */
function normalizeTenantIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : [];
  const out = raw
    .map((t) => toTenantId(t))
    .filter((x): x is string => Boolean(x));

  return out.length > 0 ? out : DEFAULT_RBAC.tenantIds;
}

/** Normalise un tenantId unique (trim + lowercase). */
function normalizeTenantId(input: unknown): string {
  return toTenantId(input) ?? DEFAULT_RBAC.defaultTenantId;
}

/** Normalise un email (trim + lowercase). */
function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

/** Normalise un nom (trim). */
function normalizeName(input: unknown): string {
  return String(input ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/* Domain (DTO) -> UI (form values)                                           */
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
    password: "", // jamais exposé
    rbac: {
      role: user.rbac?.role ?? DEFAULT_RBAC.role,
      tenantIds: normalizeTenantIds(user.rbac?.tenantIds),
      defaultTenantId: normalizeTenantId(user.rbac?.defaultTenantId),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Normalisations UI (forms)                                                  */
/* -------------------------------------------------------------------------- */

export function normalizeUserFormValues(
  values: UserFormValues,
): UserFormValues {
  return {
    ...(values.id ? { id: String(values.id).trim() } : {}),
    email: normalizeEmail(values.email),
    name: normalizeName(values.name),
    // ⚠️ on ne trim pas ici pour éviter de surprendre l’UI (le trim est fait au submit)
    password: String(values.password ?? ""),
    rbac: {
      role: values.rbac?.role ?? DEFAULT_RBAC.role,
      tenantIds: normalizeTenantIds(values.rbac?.tenantIds),
      defaultTenantId: normalizeTenantId(values.rbac?.defaultTenantId),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API studio)                                                 */
/* -------------------------------------------------------------------------- */

export function toCreateUserIntentDTOFromFormValues(
  values: UserFormValues,
): CreateUserIntentDTO {
  const v = normalizeUserFormValues(values);

  return {
    email: v.email,
    name: v.name,
    password: String(v.password ?? "").trim(),
    rbac: v.rbac,
  };
}

export function toUpdateUserIntentDTOFromFormValues(
  p: Partial<UserFormValues>,
): UpdateUserIntentDTO {
  const out: UpdateUserIntentDTO = {};

  if ("email" in p && p.email !== undefined) {
    out.email = normalizeEmail(p.email);
  }

  if ("name" in p && p.name !== undefined) {
    out.name = normalizeName(p.name);
  }

  // password : optionnel, "" = no change
  if ("password" in p && typeof p.password === "string") {
    const pwd = p.password.trim();
    if (pwd.length > 0) out.password = pwd;
  }

  if ("rbac" in p && p.rbac !== undefined) {
    out.rbac = {
      role: p.rbac?.role ?? DEFAULT_RBAC.role,
      tenantIds: normalizeTenantIds(p.rbac?.tenantIds),
      defaultTenantId: normalizeTenantId(p.rbac?.defaultTenantId),
    };
  }

  return out;
}
