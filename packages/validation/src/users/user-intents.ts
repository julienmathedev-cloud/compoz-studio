/**
 * @file packages/validation/src/users/user-intents.ts
 * @layer schemas
 *
 * @description
 * Schémas Zod décrivant la forme frontière des intentions liées aux utilisateurs (Studio).
 * Ces schémas valident la structure des payloads API / UI ; les invariants métier
 * et décisions, unicité email, règles RBAC, etc. restent dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  UserEmailSchema,
  UserIdParamSchema,
  UserRoleSchema,
  WebsiteIdSchema,
  WebsiteIdsSchema,
} from "@compoz/validation/users/user";

/* -------------------------------------------------------------------------- */
/*                               Champs intent                                */
/* -------------------------------------------------------------------------- */

/**
 * Name, forme frontière :
 * - trim
 * - requis pour la création
 */
export const UserNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Password, forme frontière :
 * - trim via preprocess
 * - requis / non vide quand présent
 *
 * @remarks
 * Le hash/stockage est infra-only ; le domaine vérifie aussi non vide.
 */
export const UserPasswordSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1, ERROR_CODES.USER_PASSWORD_REQUIRED),
);

/**
 * RBAC, forme frontière intent.
 *
 * @remarks
 * On réutilise les schémas canoniques, normalisation + contraintes minimales.
 * Les règles métier avancées, permissions, transitions, etc. restent dans le domaine.
 */
export const UserRbacIntentSchema = z
  .object({
    role: UserRoleSchema,
    websiteIds: WebsiteIdsSchema,
    defaultWebsiteId: WebsiteIdSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            Intentions HTTP API                             */
/* -------------------------------------------------------------------------- */

export const CreateUserIntentSchema = z
  .object({
    email: UserEmailSchema,
    name: UserNameSchema,
    password: UserPasswordSchema,
    rbac: UserRbacIntentSchema,
  })
  .strict();

export type CreateUserIntentDTO = z.infer<typeof CreateUserIntentSchema>;

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
 * Intention pour un listing, placeholder : pas de payload.
 */
export const ListUsersIntentSchema = z.object({}).strict();
export type ListUsersIntentDTO = z.infer<typeof ListUsersIntentSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Params                                    */
/* -------------------------------------------------------------------------- */

export { UserIdParamSchema };
