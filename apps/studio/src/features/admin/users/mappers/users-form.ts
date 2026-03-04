/**
 * @file apps/studio/src/features/admin/users/mappers/users-form.ts
 * @layer ui-mappers/admin-users
 *
 * @description
 * Mappers "forms admin" dashboard pour les users :
 * - normalisations UI (trim/coercitions simples)
 * - construction des Intent DTO pour l’API admin
 *
 * @remarks
 * - Users = Studio-only (pas de mapper shared runtime).
 * - Le password n'est jamais renvoyé depuis l’API.
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
  tenantIds: ["default"],
  defaultTenantId: "default",
};

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
      tenantIds: (user.rbac?.tenantIds?.length
        ? user.rbac.tenantIds
        : DEFAULT_RBAC.tenantIds
      )
        .map((t) => String(t ?? "").trim())
        .filter(Boolean),
      defaultTenantId: String(
        user.rbac?.defaultTenantId ?? DEFAULT_RBAC.defaultTenantId,
      ).trim(),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Normalisations UI (forms)                                                  */
/* -------------------------------------------------------------------------- */

export function normalizeUserFormValues(
  values: UserFormValues,
): UserFormValues {
  const tenantIds = (values.rbac?.tenantIds ?? [])
    .map((t) =>
      String(t ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  const defaultTenantId = String(values.rbac?.defaultTenantId ?? "")
    .trim()
    .toLowerCase();

  return {
    ...(values.id ? { id: String(values.id).trim() } : {}),
    email: String(values.email ?? "")
      .trim()
      .toLowerCase(),
    name: String(values.name ?? "").trim(),
    password: String(values.password ?? ""),
    rbac: {
      role: values.rbac?.role ?? DEFAULT_RBAC.role,
      tenantIds: tenantIds.length > 0 ? tenantIds : DEFAULT_RBAC.tenantIds,
      defaultTenantId: defaultTenantId || DEFAULT_RBAC.defaultTenantId,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API admin)                                                  */
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
    out.email = String(p.email ?? "")
      .trim()
      .toLowerCase();
  }

  if ("name" in p && p.name !== undefined) {
    out.name = String(p.name ?? "").trim();
  }

  // password : optionnel, "" = no change
  if ("password" in p && typeof p.password === "string") {
    const pwd = p.password.trim();
    if (pwd.length > 0) out.password = pwd;
  }

  if ("rbac" in p && p.rbac !== undefined) {
    const tenantIds = (p.rbac?.tenantIds ?? [])
      .map((t) =>
        String(t ?? "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    const defaultTenantId = String(p.rbac?.defaultTenantId ?? "")
      .trim()
      .toLowerCase();

    out.rbac = {
      role: p.rbac?.role ?? DEFAULT_RBAC.role,
      tenantIds: tenantIds.length > 0 ? tenantIds : DEFAULT_RBAC.tenantIds,
      defaultTenantId: defaultTenantId || DEFAULT_RBAC.defaultTenantId,
    };
  }

  return out;
}
