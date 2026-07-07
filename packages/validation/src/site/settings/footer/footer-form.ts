/**
 * @file packages/validation/src/site/settings/footer/footer-form.ts
 * @layer schemas
 *
 * @description
 * Reuses footer settings validation as the UI form schema.
 */

import {
  FooterSettingsSchema,
  type FooterSettingsShape,
} from "@compoz/validation/site/settings/footer/footer";

export const FooterFormSchema = FooterSettingsSchema;
export type FooterFormValues = FooterSettingsShape;
