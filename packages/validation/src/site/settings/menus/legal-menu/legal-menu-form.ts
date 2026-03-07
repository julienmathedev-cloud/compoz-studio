/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition du menu légal.
 *
 * @remarks
 * - Schéma UI (RHF-friendly) : `href` est une string contrôlée.
 * - Les règles "requis" et "format URL" sont appliquées en `superRefine`
 *   pour accepter les valeurs draft (`""`) pendant la saisie.
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Item (UI)                                   */
/* -------------------------------------------------------------------------- */

export const LegalMenuItemFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(MENU_LABEL.MAX, ERROR_CODES.LEGAL_MENU_LABEL_TOO_LONG),
    href: z.string().trim(),
    newTab: z.boolean(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const label = val.label.trim();
    const href = val.href.trim();

    // label requis
    if (label.length < MENU_LABEL.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.LEGAL_MENU_LABEL_REQUIRED,
      });
    }

    // href requis + format
    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_REQUIRED,
      });
      return;
    }

    if (!AssetUrlSchema.safeParse(href).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_INVALID,
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                             Settings (UI)                                  */
/* -------------------------------------------------------------------------- */

export const LegalMenuFormSchema = z
  .object({
    items: z.array(LegalMenuItemFormSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.LEGAL_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

export type LegalMenuItemFormValues = z.infer<typeof LegalMenuItemFormSchema>;
export type LegalMenuFormValues = z.infer<typeof LegalMenuFormSchema>;
