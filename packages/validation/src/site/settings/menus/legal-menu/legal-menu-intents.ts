/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées au menu légal.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { LegalMenuSettingsSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { z } from "zod";

/**
 * Intention de mise à jour des réglages du menu légal.
 * Contrat : payload partiel aligné sur la forme des settings (draft-only).
 */
export const UpdateLegalMenuSettingsIntentSchema =
  LegalMenuSettingsSchema.partial().strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateLegalMenuSettingsIntentDTO = z.infer<
  typeof UpdateLegalMenuSettingsIntentSchema
>;
