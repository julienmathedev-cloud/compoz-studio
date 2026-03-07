/**
 * @file packages/validation/src/site/settings/social/social.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des réglages et items sociaux.
 * Ces schémas valident uniquement la structure canonique des données exposées ;
 * les valeurs draft-friendly ("" pendant la saisie) sont gérées côté form schema.
 */

import { SOCIAL_ITEM } from "@compoz/core/constants/limits/social";
import {
  SOCIAL_KIND_EMAIL,
  SOCIAL_KINDS,
} from "@compoz/core/constants/social/social-kinds";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";
import { AbsoluteHttpUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/** Kind (strict enum). */
const SocialKindSchema = z.enum(SOCIAL_KINDS);

/** Mailto valide (policy partagée). */
const MailtoHrefSchema = z.string().trim().refine(isMailtoHref, {
  message: ERROR_CODES.SOCIAL_MAILTO_INVALID,
});

/**
 * Item social — canonique (non draft).
 * - href doit être valide (pas "", pas de préfixe seul).
 * - email => mailto obligatoire
 * - autres => URL http(s) absolue obligatoire (mailto interdit)
 */
export const SocialItemSchema = z
  .object({
    kind: SocialKindSchema,
    href: z.string().trim().min(1, ERROR_CODES.SOCIAL_HREF_REQUIRED),
  })
  .strict()
  .superRefine((val, ctx) => {
    const href = val.href.trim();

    const isMailto = MailtoHrefSchema.safeParse(href).success;

    // email → mailto obligatoire
    if (val.kind === SOCIAL_KIND_EMAIL) {
      if (!isMailto) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["href"],
          message: ERROR_CODES.SOCIAL_EMAIL_REQUIRES_MAILTO,
        });
      }
      return;
    }

    // autres → mailto interdit
    if (isMailto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_MAILTO_RESERVED_FOR_EMAIL,
      });
      return;
    }

    // autres → http(s) absolu requis
    const isAbs = AbsoluteHttpUrlSchema.safeParse(href).success;
    if (!isAbs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_ABSOLUTE_REQUIRED,
      });
    }
  });

/** Settings social (liste ordonnée). */
export const SocialSettingsSchema = z
  .object({
    items: z
      .array(SocialItemSchema)
      .max(SOCIAL_ITEM.MAX, ERROR_CODES.SOCIAL_TOO_MANY_ITEMS),
  })
  .strict();

export type SocialItemShape = z.infer<typeof SocialItemSchema>;
export type SocialSettingsShape = z.infer<typeof SocialSettingsSchema>;
