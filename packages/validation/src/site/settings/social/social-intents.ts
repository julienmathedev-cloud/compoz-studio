/**
 * @file packages/validation/src/site/settings/social/social-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages Social.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { SocialItemSchema } from "@compoz/validation/site/settings/social/social";
import { z } from "zod";

/**
 * Intention de mise à jour des réglages Social (draft-only).
 *
 * Note Zod :
 * `.partial()` n'est pas utilisable lorsque l'objet contient des schémas avec refinements
 * (ex. `SocialItemSchema.superRefine(...)`).
 *
 * On définit donc explicitement le payload patchable : `{ items?: ... }`.
 */
export const UpdateSocialSettingsIntentSchema = z
  .object({
    items: z.array(SocialItemSchema).optional(),
  })
  .strict();

/**
 * DTO d’intention : résultat typé du parsing du payload Social.
 */
export type UpdateSocialSettingsIntentDTO = z.infer<
  typeof UpdateSocialSettingsIntentSchema
>;
