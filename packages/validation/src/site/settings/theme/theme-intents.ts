/**
 * @file packages/validation/src/site/settings/theme/theme-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages du thème public.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import type { z } from "zod";

import {
  PublicThemeTokensSchema,
  ThemeSettingsObjectSchema,
} from "@compoz/validation/site/settings/theme/theme";

/**
 * Intention de mise à jour des réglages du thème public.
 *
 * @remarks
 * - Contrat : payload partiel aligné sur la forme des settings.
 * - `lightTokens` et `darkTokens` acceptent aussi des patchs partiels.
 * - On part de `ThemeSettingsObjectSchema` et non `ThemeSettingsSchema`
 *   car `.partial()` n’est pas compatible avec un schéma contenant des refinements.
 */
export const UpdateThemeSettingsIntentSchema =
  ThemeSettingsObjectSchema.partial()
    .extend({
      lightTokens: PublicThemeTokensSchema.partial().optional(),
      darkTokens: PublicThemeTokensSchema.partial().optional(),
    })
    .strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateThemeSettingsIntentDTO = z.infer<
  typeof UpdateThemeSettingsIntentSchema
>;
