/**
 * @file packages/validation/src/site/settings/menus/primary-menu/primary-menu-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées au menu principal.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { PrimaryMenuItemSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import { z } from "zod";

export const UpdatePrimaryMenuSettingsIntentSchema = z
  .object({
    items: z.array(PrimaryMenuItemSchema).optional(),
  })
  .strict();

export type UpdatePrimaryMenuSettingsIntentDTO = z.infer<
  typeof UpdatePrimaryMenuSettingsIntentSchema
>;
