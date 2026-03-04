/**
 * @file packages/ui/src/users/mappers/user-shape.ts
 * @layer ui-mappers/users
 *
 * @description
 * Mapper "shared runtime" pour les users :
 * - DTO domaine -> valeurs frontières stables (utilisées par le Studio côté UI)
 *
 * @remarks
 * Ici on reste volontairement "runtime/shared" :
 * - pas d’intents API
 * - pas de logique métier (unicité, règles RBAC, etc.)
 * - juste de la mise en forme stable basée sur les schémas Zod du form.
 */

import type { UserDTO } from "@compoz/core/domain/users/dto";
import type { UserFormValues } from "@compoz/validation/users/user-form";

/* -------------------------------------------------------------------------- */
/* Defaults (frontière)                                                       */
/* -------------------------------------------------------------------------- */

const DEFAULT_RBAC: UserFormValues["rbac"] = {
  role: "editor",
  tenantIds: [],
  defaultTenantId: "",
};

/* -------------------------------------------------------------------------- */
/* Domain (DTO) -> Shape frontière (safe)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un `UserDTO` en shape frontière stable (basée sur tes types Zod form).
 *
 * @remarks
 * - `password` est toujours "" en sortie (jamais exposé côté UI).
 * - Normalise `email` en lower-case.
 * - `name` : fallback "" (car le form le requiert en V0.5).
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
      rbac: DEFAULT_RBAC,
    };
  }

  return {
    id: String(user.id ?? "").trim(),
    email: String(user.email ?? "")
      .trim()
      .toLowerCase(),
    name: String(user.name ?? "").trim(),
    password: "",

    rbac: {
      role: (user.rbac?.role ??
        DEFAULT_RBAC.role) as UserFormValues["rbac"]["role"],
      tenantIds: Array.isArray(user.rbac?.tenantIds)
        ? user.rbac.tenantIds.map((t) => String(t ?? "").trim()).filter(Boolean)
        : DEFAULT_RBAC.tenantIds,
      defaultTenantId: String(
        user.rbac?.defaultTenantId ?? DEFAULT_RBAC.defaultTenantId,
      ).trim(),
    },
  };
}
