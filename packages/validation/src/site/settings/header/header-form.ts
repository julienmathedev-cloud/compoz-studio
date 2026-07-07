/**
 * @file packages/validation/src/site/settings/header/header-form.ts
 * @layer schemas
 *
 * @description
 * Reuses header settings validation as the UI form schema.
 */

import {
  HeaderSettingsSchema,
  type HeaderSettingsShape,
} from "@compoz/validation/site/settings/header/header";

export const HeaderFormSchema = HeaderSettingsSchema;
export type HeaderFormValues = HeaderSettingsShape;
