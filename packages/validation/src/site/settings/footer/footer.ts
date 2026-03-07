/**
 * @file packages/validation/src/site/settings/footer/footer.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière des réglages de footer.
 * Ce schéma est aligné sur l’entité domaine associée et ne définit aucun default.
 */
import { FOOTER_COPYRIGHT } from "@compoz/core/constants/limits/footer";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

/**
 * Schéma strict pour les réglages du footer.
 * - Trim implicite sur `copyright`
 * - Autorise `""` (choix UI), mais impose une limite maximale
 */
export const FooterSettingsSchema = z
  .object({
    /** Texte libre ; trim ; autorise vide ; borné côté limites. */
    copyright: z
      .string()
      .trim()
      .max(FOOTER_COPYRIGHT.MAX, ERROR_CODES.FOOTER_COPYRIGHT_TOO_LONG),

    /** Affichage automatique de l’année courante. */
    showYear: z.boolean(),
  })
  .strict();

/** Shape frontière (après parsing Zod). */
export type FooterSettingsShape = z.infer<typeof FooterSettingsSchema>;
