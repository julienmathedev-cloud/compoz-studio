/**
 * @file packages/validation/src/site/settings/header/header.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière des réglages de header.
 * Ce schéma est aligné sur l’entité domaine associée et ne définit aucun default.
 */

import { z } from "zod";

/** Schéma strict pour les réglages du header. */
export const HeaderSettingsSchema = z
  .object({
    /** Affiche ou non le logo dans le header. */
    showLogo: z.boolean(),
    /** Affiche ou non le titre du site dans le header. */
    showSiteName: z.boolean(),
    /** Rend le header collant en haut de l'écran. */
    sticky: z.boolean(),
    /** Active un effet de flou d’arrière-plan. */
    blur: z.boolean(),
    /** Inverse l’ordre menu ↔ liens sociaux. */
    swapPrimaryAndSocial: z.boolean(),
  })
  .strict();

/** Shape frontière (après parsing Zod). */
export type HeaderSettingsShape = z.infer<typeof HeaderSettingsSchema>;
