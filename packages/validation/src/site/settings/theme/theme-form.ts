/**
 * @file packages/validation/src/site/settings/theme/theme-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition du thème public.
 * Ce schéma est volontairement aligné sur la forme des réglages associés afin de
 * garantir des valeurs complètes côté UI.
 */

import {
  ThemeSettingsSchema,
  type ThemeSettingsShape,
} from "@compoz/validation/site/settings/theme/theme";

export const ThemeFormSchema = ThemeSettingsSchema;
export type ThemeFormValues = ThemeSettingsShape;
