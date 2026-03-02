/**
 * @file packages/validation/src/site/settings/footer/footer-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition du footer.
 * Ce schéma correspond volontairement à la forme des settings associées et
 * garantit des valeurs complètes côté UI.
 */

import {
  FooterSettingsSchema,
  type FooterSettingsShape,
} from "@compoz/validation/site/settings/footer/footer";

export const FooterFormSchema = FooterSettingsSchema;
export type FooterFormValues = FooterSettingsShape;
