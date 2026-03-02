/**
 * @file packages/validation/src/site/settings/footer/footer-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages de footer.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { FooterSettingsSchema } from "@compoz/validation/site/settings/footer/footer";
import type { z } from "zod";

/**
 * Intention de mise à jour des réglages de footer.
 * Contrat : payload partiel aligné sur la forme des settings (draft-only).
 */
export const UpdateFooterSettingsIntentSchema =
  FooterSettingsSchema.partial().strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateFooterSettingsIntentDTO = z.infer<
  typeof UpdateFooterSettingsIntentSchema
>;
