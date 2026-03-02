/**
 * @file packages/validation/src/site/settings/header/header-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages de header.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { HeaderSettingsSchema } from "@compoz/validation/site/settings/header/header";
import type { z } from "zod";

/**
 * Intention de mise à jour des réglages de header.
 * Contrat : payload partiel aligné sur la forme des settings (draft-only).
 */
export const UpdateHeaderSettingsIntentSchema =
  HeaderSettingsSchema.partial().strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateHeaderSettingsIntentDTO = z.infer<
  typeof UpdateHeaderSettingsIntentSchema
>;
