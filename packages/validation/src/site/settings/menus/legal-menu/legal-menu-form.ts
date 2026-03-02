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

import { MENU } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Item (UI)                                   */
/* -------------------------------------------------------------------------- */

export const LegalMenuItemFormSchema = z
  .object({
    /**
     * Libellé du lien.
     * - Draft-friendly : autorise "" en saisie, mais requis via superRefine.
     */
    label: z
      .string()
      .trim()
      .max(MENU.LABEL_MAX, ERROR_CODES.LEGAL_MENU_LABEL_TOO_LONG),

    /**
     * URL / chemin.
     * - Draft-friendly : string contrôlée.
     * - Validation de format via AssetUrlSchema en superRefine pour message dédié.
     */
    href: z.string().trim(),

    /** Ouverture dans un nouvel onglet. */
    newTab: z.boolean(),
  })
  .superRefine((val, ctx) => {
    // label requis
    const label = val.label.trim();
    if (label.length < MENU.LABEL_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.LEGAL_MENU_LABEL_REQUIRED,
      });
    }

    // href requis + format
    const href = val.href.trim();
    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_REQUIRED,
      });
      return;
    }

    const ok = AssetUrlSchema.safeParse(href).success;
    if (!ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_INVALID,
      });
    }
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                             Settings (UI)                                  */
/* -------------------------------------------------------------------------- */

export const LegalMenuFormSchema = z
  .object({
    items: z.array(LegalMenuItemFormSchema).max(MENU.ITEM_MAX, {
      message: ERROR_CODES.LEGAL_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

export type LegalMenuItemFormValues = z.infer<typeof LegalMenuItemFormSchema>;
export type LegalMenuFormValues = z.infer<typeof LegalMenuFormSchema>;
