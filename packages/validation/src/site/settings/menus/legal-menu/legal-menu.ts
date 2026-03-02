/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière des réglages du menu légal.
 * Ce schéma valide uniquement la structure des données ; les règles métier et
 * dérivations (ex. liens externes) sont traitées dans le domaine.
 */

import { MENU } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Item individuel                             */
/* -------------------------------------------------------------------------- */

export const LegalMenuItemSchema = z
  .object({
    /**
     * Libellé du lien.
     * - Côté settings : valeur canonique, donc requis (min/max).
     */
    label: z
      .string()
      .trim()
      .min(MENU.LABEL_MIN, ERROR_CODES.LEGAL_MENU_LABEL_REQUIRED)
      .max(MENU.LABEL_MAX, ERROR_CODES.LEGAL_MENU_LABEL_TOO_LONG),

    /**
     * URL / chemin.
     * - Côté settings : valeur canonique, donc URL valide (asset abs/rel) requise.
     */
    href: AssetUrlSchema,

    /** Ouverture dans un nouvel onglet. */
    newTab: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                         Schéma global du menu légal                        */
/* -------------------------------------------------------------------------- */

export const LegalMenuSettingsSchema = z
  .object({
    items: z.array(LegalMenuItemSchema).max(MENU.ITEM_MAX, {
      message: ERROR_CODES.LEGAL_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Types shape                                 */
/* -------------------------------------------------------------------------- */

export type LegalMenuItemShape = z.infer<typeof LegalMenuItemSchema>;
export type LegalMenuSettingsShape = z.infer<typeof LegalMenuSettingsSchema>;
