/**
 * @file packages/validation/src/users/user-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire UI de création / édition d’un user Studio.
 * UI-first (RHF) : on autorise des champs “draft-friendly” côté form, puis le domaine tranche
 * (unicité email, règles RBAC complètes, etc.).
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";

/* -------------------------------------------------------------------------- */
/*                                   Champs                                   */
/* -------------------------------------------------------------------------- */

/**
 * Email UI :
 * - trim
 * - requis
 * - format email basique
 */
const UserEmailFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_EMAIL_REQUIRED)
  .email(ERROR_CODES.USER_EMAIL_INVALID_FORMAT);

/**
 * Name UI :
 * - trim
 * - requis (V0.5)
 */
const UserNameFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Password UI :
 * - "" autorisé pendant l’édition (si on ne veut pas changer le mot de passe)
 * - si non vide : doit être non vide après trim
 */
const UserPasswordFormSchema = z.string().superRefine((val, ctx) => {
  const v = String(val ?? "").trim();
  if (v.length === 0) return; // ✅ "no change" (edit mode)
  // Si tu veux imposer un minimum (ex: 8), tu pourras le renforcer ici.
  if (v.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: ERROR_CODES.USER_PASSWORD_REQUIRED,
    });
  }
});

/**
 * Role UI.
 */
const UserRoleFormSchema = z.enum(["admin", "editor"], {
  message: ERROR_CODES.USER_ROLE_INVALID,
});

/**
 * tenantIds UI :
 * - array de strings trim
 * - non vide
 *
 * @remarks
 * On garde ça UI-friendly. La règle "defaultTenantId ∈ tenantIds sauf wildcard"
 * est revalidée plus bas via superRefine.
 */
const TenantIdsFormSchema = z
  .array(z.string().trim().min(1))
  .min(1, ERROR_CODES.USER_TENANT_IDS_REQUIRED);

/**
 * defaultTenantId UI :
 * - requis
 */
const DefaultTenantIdFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_DEFAULT_TENANT_REQUIRED);

/**
 * RBAC UI.
 */
const UserRbacFormSchema = z
  .object({
    role: UserRoleFormSchema,
    tenantIds: TenantIdsFormSchema,
    defaultTenantId: DefaultTenantIdFormSchema,
  })
  .strict()
  .superRefine((rbac, ctx) => {
    const tenantIds = rbac.tenantIds.map((t) => t.trim()).filter(Boolean);

    const defaultTenantId = rbac.defaultTenantId.trim();
    const hasWildcard = tenantIds.includes("*");

    if (
      !hasWildcard &&
      defaultTenantId &&
      !tenantIds.includes(defaultTenantId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultTenantId"],
        message: ERROR_CODES.USER_DEFAULT_TENANT_NOT_ALLOWED,
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */

/**
 * Schéma du formulaire User.
 *
 * @remarks
 * - `id` est optionnel : utile pour le mode edit (form “bound” à un user existant).
 * - `password` : "" = pas de changement.
 */
export const UserFormSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.USER_ID_REQUIRED).optional(),
    email: UserEmailFormSchema,
    name: UserNameFormSchema,
    password: UserPasswordFormSchema,
    rbac: UserRbacFormSchema,
  })
  .strict();

export type UserFormValues = z.infer<typeof UserFormSchema>;
