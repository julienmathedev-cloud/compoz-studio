/**
 * @file packages/validation/src/users/user.ts
 * @layer schemas
 *
 * @description
 * Définit les schémas Zod décrivant la forme frontière d’un utilisateur Studio.
 * Ces schémas valident uniquement la structure des données exposées API / infra ;
 * les invariants métier et règles globales sont traités dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { IsoDateStringSchema } from "@compoz/validation/common/date";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

/**
 * Id technique d'un User.
 *
 * Contrat :
 * - trim
 * - non vide
 *
 * @remarks
 * À ce stade on ne contraint pas le format, uuid, prefix, etc.,
 * car l’infra peut évoluer : KV, DB, migration.
 */
export const UserIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_ID_REQUIRED);

/**
 * Email :
 * - trim
 * - lower-case, boundary normalization
 * - format email, validation Zod
 */
export const UserEmailSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_EMAIL_REQUIRED)
  .email(ERROR_CODES.USER_EMAIL_INVALID_FORMAT)
  .transform((value) => value.toLowerCase());

/**
 * Nom affiché :
 * - trim
 * - optionnel au niveau storage DTO
 *
 * @remarks
 * Les use-cases peuvent imposer required selon le flow, ex: create user.
 */
export const UserNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Role RBAC minimal, V0.5.
 */
export const UserRoleSchema = z.enum(["admin", "editor"], {
  message: ERROR_CODES.USER_ROLE_INVALID,
});

/**
 * Status utilisateur.
 */
export const UserStatusSchema = z.enum(["active", "disabled"], {
  message: ERROR_CODES.USER_STATUS_INVALID,
});

/**
 * Website id normalisé.
 *
 * Contrat :
 * - trim
 * - lower-case
 * - non vide
 * - pas de wildcard "*"
 */
export const WebsiteIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_WEBSITE_IDS_REQUIRED)
  .transform((value) => value.toLowerCase())
  .refine((value) => value !== "*", ERROR_CODES.USER_WEBSITE_IDS_INVALID);

/**
 * Liste de Websites :
 * - array non vide
 * - strings normalisées
 * - unique, best-effort
 */
export const WebsiteIdsSchema = z
  .array(WebsiteIdSchema)
  .min(1, ERROR_CODES.USER_WEBSITE_IDS_REQUIRED)
  .superRefine((websiteIds, ctx) => {
    const seen = new Set<string>();

    for (let index = 0; index < websiteIds.length; index++) {
      const websiteId = websiteIds[index];

      if (seen.has(websiteId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: ERROR_CODES.USER_WEBSITE_IDS_INVALID,
        });
        return;
      }

      seen.add(websiteId);
    }
  });

/**
 * Id technique d'une sandbox démo.
 *
 * Contrat :
 * - trim
 * - non vide
 *
 * @remarks
 * À ce stade on ne contraint pas le format exact.
 */
export const DemoInstanceIdSchema = z.string().trim().min(1);

/* -------------------------------------------------------------------------- */
/*                                   RBAC                                     */
/* -------------------------------------------------------------------------- */

export const UserRbacSchema = z
  .object({
    role: UserRoleSchema,
    websiteIds: WebsiteIdsSchema,
    defaultWebsiteId: WebsiteIdSchema,
  })
  .strict()
  .superRefine((rbac, ctx) => {
    if (!rbac.websiteIds.includes(rbac.defaultWebsiteId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_CODES.USER_DEFAULT_WEBSITE_NOT_ALLOWED,
        path: ["defaultWebsiteId"],
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                                   Meta                                     */
/* -------------------------------------------------------------------------- */

export const UserMetaSchema = z
  .object({
    createdAt: IsoDateStringSchema,
    updatedAt: IsoDateStringSchema,
    lastLoginAt: IsoDateStringSchema.optional(),
  })
  .strict();

/**
 * Métadonnées de sandbox démo associées à un utilisateur temporaire.
 */
export const UserDemoMetaSchema = z
  .object({
    isDemo: z.boolean(),
    demoInstanceId: DemoInstanceIdSchema,
    expiresAt: IsoDateStringSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                  Params                                    */
/* -------------------------------------------------------------------------- */

export const UserIdParamSchema = z.object({ userId: UserIdSchema }).strict();

/* -------------------------------------------------------------------------- */
/*                                   User                                     */
/* -------------------------------------------------------------------------- */

export const UserSchema = z
  .object({
    id: UserIdSchema,
    email: UserEmailSchema,
    name: UserNameSchema,
    status: UserStatusSchema,
    rbac: UserRbacSchema,
    meta: UserMetaSchema,
    demo: UserDemoMetaSchema.optional(),
  })
  .strict();

/**
 * Résumé minimal, list/admin.
 *
 * @remarks
 * `name` reste aligné domaine.
 */
export const UserSummarySchema = z
  .object({
    id: UserIdSchema,
    email: UserEmailSchema,
    name: UserNameSchema,
    status: UserStatusSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UserShape = z.infer<typeof UserSchema>;
export type UserSummaryShape = z.infer<typeof UserSummarySchema>;
export type UserRbacShape = z.infer<typeof UserRbacSchema>;
export type UserRoleShape = z.infer<typeof UserRoleSchema>;
export type UserStatusShape = z.infer<typeof UserStatusSchema>;
export type UserIdShape = z.infer<typeof UserIdSchema>;
export type UserIdParamShape = z.infer<typeof UserIdParamSchema>;
export type WebsiteIdShape = z.infer<typeof WebsiteIdSchema>;
export type WebsiteIdsShape = z.infer<typeof WebsiteIdsSchema>;
export type DemoInstanceIdShape = z.infer<typeof DemoInstanceIdSchema>;
export type UserDemoMetaShape = z.infer<typeof UserDemoMetaSchema>;
