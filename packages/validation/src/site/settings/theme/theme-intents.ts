/**
 * @file packages/validation/src/site/settings/theme/theme-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the public theme settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { z } from "zod";

import {
  PublicThemeTokensSchema,
  ThemeSettingsObjectSchema,
  ThemeSettingsSchema,
} from "@compoz/validation/site/settings/theme/theme";

/**
 * Uses the object schema because `.partial()` cannot be applied safely to the
 * refined final theme settings schema.
 *
 * @remarks
 * Token groups remain atomic OCC values even when the outer section patch is partial.
 */
const ThemeSettingsPatchSchema =
  ThemeSettingsObjectSchema.partial()
    .extend({
      lightTokens: PublicThemeTokensSchema.optional(),
      darkTokens: PublicThemeTokensSchema.optional(),
    })
    .strict();

export const UpdateThemeSettingsIntentSchema = z.object({
  baseline: ThemeSettingsSchema,
  patch: ThemeSettingsPatchSchema,
  expectedRevision: z.number().int().nonnegative().optional(),
}).strict();

export type UpdateThemeSettingsIntentDTO = z.infer<typeof ThemeSettingsPatchSchema>;
export type UpdateThemeSettingsOCCIntentDTO = z.infer<
  typeof UpdateThemeSettingsIntentSchema
>;
