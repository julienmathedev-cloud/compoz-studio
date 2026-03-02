/**
 * @file packages/validation/src/site/primary-menu/primary-menu.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière des réglages du menu principal.
 * Ce schéma valide uniquement la structure canonique des settings (côté domaine/DTO).
 * Les règles UX draft-friendly appartiennent au schéma de formulaire.
 */

import { MENU } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Child                                     */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuChildSchema = z
  .object({
    /** Libellé canonique : requis (min/max). */
    label: z
      .string()
      .trim()
      .min(MENU.LABEL_MIN, ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED)
      .max(MENU.LABEL_MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),

    /** Href canonique : asset URL (abs/rel) requise. */
    href: AssetUrlSchema,

    /** Ouverture dans un nouvel onglet. */
    newTab: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                  Parent/Leaf                               */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuItemSchema = z
  .object({
    /** Libellé canonique : requis (min/max). */
    label: z
      .string()
      .trim()
      .min(MENU.LABEL_MIN, ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED)
      .max(MENU.LABEL_MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),

    /**
     * Href canonique :
     * - item feuille : requis (asset URL)
     * - item parent (avec children) : optionnel (certains parents sont “ouvrants” uniquement)
     */
    href: AssetUrlSchema.optional(),

    /** Ouverture nouvel onglet (interdit si parent avec children). */
    newTab: z.boolean(),

    /** Enfants (max 2 niveaux géré côté UI/renderer). */
    children: z.array(PrimaryMenuChildSchema).optional(),
  })
  .superRefine((val, ctx) => {
    const hasChildren = Array.isArray(val.children) && val.children.length > 0;

    // Parent : newTab interdit (cohérence nav)
    if (hasChildren && val.newTab !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newTab"],
        message: ERROR_CODES.PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN,
      });
    }

    // Leaf : href requis
    if (!hasChildren && typeof val.href !== "string") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
    }
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                  Settings                                  */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuSettingsSchema = z
  .object({
    items: z.array(PrimaryMenuItemSchema).max(MENU.ITEM_MAX, {
      message: ERROR_CODES.PRIMARY_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PrimaryMenuChildShape = z.infer<typeof PrimaryMenuChildSchema>;
export type PrimaryMenuItemShape = z.infer<typeof PrimaryMenuItemSchema>;
export type PrimaryMenuSettingsShape = z.infer<
  typeof PrimaryMenuSettingsSchema
>;
