/**
 * @file packages/validation/src/site/settings/header/header-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition du header.
 * Ce schéma est volontairement aligné sur la forme des réglages associées afin de
 * garantir des valeurs complètes côté UI.
 */

import {
  HeaderSettingsSchema,
  type HeaderSettingsShape,
} from "@compoz/validation/site/settings/header/header";

export const HeaderFormSchema = HeaderSettingsSchema;
export type HeaderFormValues = HeaderSettingsShape;
