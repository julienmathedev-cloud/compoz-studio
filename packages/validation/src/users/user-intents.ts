/**
 * @file packages/validation/src/users/user-intents.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme frontière des intentions liées aux utilisateurs (Studio).
 * Ces schémas valident la structure des payloads (API / UI) ; les invariants métier
 * et décisions (unicité email, règles RBAC, etc.) restent dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

/**
 * Id technique d'un User.
 */
export const UserIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_ID_REQUIRED);

export const UserIdParamSchema = z.object({ userId: UserIdSchema }).strict();

/**
 * Email (forme frontière) :
 * - trim
 * - requis
 * - format email basique
 *
 * @remarks
 * Le domaine refait une normalisation/validation (lower-case + règles).
 */
export const UserEmailSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_EMAIL_REQUIRED)
  .email(ERROR_CODES.USER_EMAIL_INVALID_FORMAT);

/**
 * Name (forme frontière) :
 * - trim
 * - requis (pour la création)
 */
export const UserNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Password (forme frontière) :
 * - trim (via preprocess)
 * - requis / non vide quand présent
 *
 * @remarks
 * Le hash/stockage est infra-only ; le domaine vérifie aussi "non vide".
 */
export const UserPasswordSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1, ERROR_CODES.USER_PASSWORD_REQUIRED),
);

/**
 * Role RBAC minimal (V0.5).
 */
export const UserRoleSchema = z.enum(["admin", "editor"], {
  message: ERROR_CODES.USER_ROLE_INVALID,
});

/**
 * RBAC (forme frontière).
 *
 * @remarks
 * - tenantIds : array non vide
 * - defaultTenantId : string non vide
 * - La règle "defaultTenantId ∈ tenantIds (sauf wildcard)" est surtout domaine,
 *   mais on garde une structure stricte ici.
 */
export const UserRbacIntentSchema = z
  .object({
    role: UserRoleSchema,
    tenantIds: z
      .array(z.string().trim().min(1))
      .min(1, ERROR_CODES.USER_TENANT_IDS_REQUIRED),
    defaultTenantId: z
      .string()
      .trim()
      .min(1, ERROR_CODES.USER_DEFAULT_TENANT_REQUIRED),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            Intentions HTTP API                             */
/* -------------------------------------------------------------------------- */

/**
 * Intention de création d’un user.
 */
export const CreateUserIntentSchema = z
  .object({
    email: UserEmailSchema,
    name: UserNameSchema,
    password: UserPasswordSchema,
    rbac: UserRbacIntentSchema,
  })
  .strict();

export type CreateUserIntentDTO = z.infer<typeof CreateUserIntentSchema>;

/**
 * Intention de mise à jour d’un user (patch partiel).
 *
 * @remarks
 * - Si `password` est présent, il doit être non vide.
 * - Le domaine gère l’unicité email, la validation RBAC et le no-op.
 */
export const UpdateUserIntentSchema = z
  .object({
    email: UserEmailSchema.optional(),
    name: UserNameSchema.optional(),
    password: UserPasswordSchema.optional(),
    rbac: UserRbacIntentSchema.optional(),
  })
  .strict();

export type UpdateUserIntentDTO = z.infer<typeof UpdateUserIntentSchema>;

/**
 * Intention pour un listing (optionnel si tu ajoutes des filtres plus tard).
 * (Pour l’instant, placeholder : pas de payload)
 */
export const ListUsersIntentSchema = z.object({}).strict();
export type ListUsersIntentDTO = z.infer<typeof ListUsersIntentSchema>;
