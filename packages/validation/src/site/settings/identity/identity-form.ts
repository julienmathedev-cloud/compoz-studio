/**
 * @file packages/validation/src/site/settings/identity/identity-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition de l’identité du site.
 * Ce schéma est destiné au formulaire UI et garantit des valeurs de type string
 * afin d’assurer un comportement stable côté formulaire.
 */

import {
  IDENTITY_LOGOALT,
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

export const IdentityFormSchema = z
  .object({
    siteName: z
      .string()
      .trim()
      .max(IDENTITY_SITENAME.MAX, ERROR_CODES.IDENTITY_SITENAME_TOO_LONG),
    tagline: z
      .string()
      .trim()
      .max(IDENTITY_TAGLINE.MAX, ERROR_CODES.IDENTITY_TAGLINE_TOO_LONG),

    // Form: toujours string, "" = vide (draft)
    logoUrl: z.string().trim(),
    logoAlt: z
      .string()
      .trim()
      .max(IDENTITY_LOGOALT.MAX, ERROR_CODES.IDENTITY_LOGO_ALT_TOO_LONG),
    faviconUrl: z.string().trim(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const siteName = val.siteName.trim();
    const logoUrl = val.logoUrl.trim();
    const logoAlt = val.logoAlt.trim();

    // siteName requis
    if (siteName.length < IDENTITY_SITENAME.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siteName"],
        message: ERROR_CODES.IDENTITY_SITENAME_REQUIRED,
      });
    }

    // logoAlt requis si logoUrl non vide
    const hasLogo = logoUrl.length > 0;
    if (hasLogo && logoAlt.length < IDENTITY_LOGOALT.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["logoAlt"],
        message: ERROR_CODES.IDENTITY_LOGO_ALT_REQUIRED,
      });
    }
  });

export type IdentityFormValues = z.infer<typeof IdentityFormSchema>;
