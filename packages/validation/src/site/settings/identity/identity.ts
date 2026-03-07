/**
 * @file packages/validation/src/site/settings/identity/identity.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière des réglages d’identité du site.
 * Ce schéma est aligné sur l’entité domaine associée et ne gère que la structure
 * des données ; les invariants métier sont traités dans le domaine.
 */

import {
  IDENTITY_LOGOALT,
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                    Base                                    */
/* -------------------------------------------------------------------------- */

/**
 * Schéma "pur" (sans refine) pour permettre de dériver des variantes
 * - Utilisé comme base pour le schéma canonique complet et les intents patch.
 */
export const IdentitySettingsBaseSchema = z
  .object({
    /** Nom du site — requis (contrainte "non vide" gérée en superRefine). */
    siteName: z
      .string()
      .trim()
      .max(IDENTITY_SITENAME.MAX, ERROR_CODES.IDENTITY_SITENAME_TOO_LONG),

    /** Baseline optionnelle — trim + borne max. */
    tagline: z
      .string()
      .trim()
      .max(IDENTITY_TAGLINE.MAX, ERROR_CODES.IDENTITY_TAGLINE_TOO_LONG)
      .optional(),

    /** URL du logo (relative ou absolue). Null/undefined si aucun logo. */
    logoUrl: z.union([AssetUrlSchema, z.null()]).optional(),

    /**
     * Texte alternatif du logo :
     * - forme permissive (accepte "" et undefined)
     * - la règle "requis si logoUrl" est gérée en superRefine
     */
    logoAlt: z
      .string()
      .trim()
      .max(IDENTITY_LOGOALT.MAX, ERROR_CODES.IDENTITY_LOGO_ALT_TOO_LONG)
      .optional(),

    /** URL du favicon — relative ou absolue. Null/undefined si aucun favicon. */
    faviconUrl: z.union([AssetUrlSchema, z.null()]).optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Canonique (full)                            */
/* -------------------------------------------------------------------------- */
export const IdentitySettingsSchema = IdentitySettingsBaseSchema.superRefine(
  (val, ctx) => {
    // --- siteName requis ---
    const siteName = val.siteName.trim();
    if (siteName.length < IDENTITY_SITENAME.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siteName"],
        message: ERROR_CODES.IDENTITY_SITENAME_REQUIRED,
      });
    }

    // --- logoAlt requis si logo ---
    const hasLogo = typeof val.logoUrl === "string";
    if (!hasLogo) return;

    const alt = typeof val.logoAlt === "string" ? val.logoAlt.trim() : "";
    if (alt.length < IDENTITY_LOGOALT.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["logoAlt"],
        message: ERROR_CODES.IDENTITY_LOGO_ALT_REQUIRED,
      });
    }
  },
);

/** Shape frontière (après parsing Zod). */
export type IdentitySettingsShape = z.infer<typeof IdentitySettingsSchema>;
