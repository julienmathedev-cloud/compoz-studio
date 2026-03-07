/**
 * @file packages/ui/src/users/mappers/user-shape.ts
 * @layer ui/users/mappers
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

function toTrimmedString(v: unknown): string {
  return String(v ?? "").trim();
}

function toOptionalId(v: unknown): string | undefined {
  const s = toTrimmedString(v);
  return s.length > 0 ? s : undefined;
}

function toLowerEmail(v: unknown): string {
  return toTrimmedString(v).toLowerCase();
}

function toRbacRole(v: unknown): UserFormValues["rbac"]["role"] {
  // On reste strict sur le type (string), et on fallback sur le rôle default.
  // Si le DTO est "dirty" avec une valeur inattendue, on retombe sur DEFAULT_RBAC.role.
  if (typeof v !== "string") return DEFAULT_RBAC.role;
  const role = v.trim();
  return (role || DEFAULT_RBAC.role) as UserFormValues["rbac"]["role"];
}

function toTenantIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((t) => toTrimmedString(t)).filter(Boolean);
}

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
      rbac: {
        ...DEFAULT_RBAC,
        tenantIds: [],
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
      tenantIds: toTenantIds(user.rbac?.tenantIds),
      defaultTenantId: toTrimmedString(
        user.rbac?.defaultTenantId ?? DEFAULT_RBAC.defaultTenantId,
      ),
    },
  };
}
