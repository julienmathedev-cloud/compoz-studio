/**
 * @file packages/validation/src/site/settings/theme/theme-form.ts
 * @layer schemas
 *
 * @description
 * Reuses theme settings validation as the UI form schema.
 */

import {
  ThemeSettingsSchema,
  type ThemeSettingsShape,
} from "@compoz/validation/site/settings/theme/theme";

export const ThemeFormSchema = ThemeSettingsSchema;
export type ThemeFormValues = ThemeSettingsShape;
