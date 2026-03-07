/**
 * @file packages/validation/src/site/settings/social/social-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages Social.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { SocialSettingsSchema } from "@compoz/validation/site/settings/social/social";
import type { z } from "zod";

/**
 * Intention de mise à jour des réglages Social (draft-only).
 *
 *
 * On définit donc explicitement le payload patchable : `{ items?: ... }`.
 */

export const UpdateSocialSettingsIntentSchema =
  SocialSettingsSchema.partial().strict();

export type UpdateSocialSettingsIntentDTO = z.infer<
  typeof UpdateSocialSettingsIntentSchema
>;
