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

import type { z } from "zod";

import {
  PublicThemeTokensSchema,
  ThemeSettingsObjectSchema,
} from "@compoz/validation/site/settings/theme/theme";

/**
 * Uses the object schema because `.partial()` cannot be applied safely to the
 * refined final theme settings schema.
 *
 * @remarks
 * Token groups also accept partial patches.
 */
export const UpdateThemeSettingsIntentSchema =
  ThemeSettingsObjectSchema.partial()
    .extend({
      lightTokens: PublicThemeTokensSchema.partial().optional(),
      darkTokens: PublicThemeTokensSchema.partial().optional(),
    })
    .strict();

export type UpdateThemeSettingsIntentDTO = z.infer<
  typeof UpdateThemeSettingsIntentSchema
>;
