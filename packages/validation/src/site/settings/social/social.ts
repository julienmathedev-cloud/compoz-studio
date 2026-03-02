/**
 * @file packages/validation/src/site/social/social.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des réglages et items sociaux.
 * Ces schémas valident uniquement la structure canonique des données exposées ;
 * les valeurs draft-friendly ("" pendant la saisie) sont gérées côté form schema.
 */

import { AbsoluteHttpUrlSchema } from "@compoz/validation/common/url-fragments";
import { SOCIAL } from "@compoz/core/constants/limits/social";
import {
  SOCIAL_KIND_EMAIL,
  SOCIAL_KINDS,
} from "@compoz/core/constants/social/social-kinds";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";
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
  .superRefine((val, ctx) => {
    const kind = val.kind;
    const href = val.href.trim();

    const isMailtoOk = MailtoHrefSchema.safeParse(href).success;
    const isAbsOk = AbsoluteHttpUrlSchema.safeParse(href).success;

    // email → mailto obligatoire
    if (kind === SOCIAL_KIND_EMAIL) {
      if (!isMailtoOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["href"],
          message: ERROR_CODES.SOCIAL_EMAIL_REQUIRES_MAILTO,
        });
      }
      return;
    }

    // autres → mailto interdit
    if (isMailtoOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_MAILTO_RESERVED_FOR_EMAIL,
      });
      return;
    }

    // autres → http(s) absolu requis
    if (!isAbsOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_ABSOLUTE_REQUIRED,
      });
    }
  })
  .strict();

/** Settings social (liste ordonnée). */
export const SocialSettingsSchema = z
  .object({
    items: z
      .array(SocialItemSchema)
      .max(SOCIAL.ITEM_MAX, ERROR_CODES.SOCIAL_TOO_MANY_ITEMS),
  })
  .strict();

export type SocialItemShape = z.infer<typeof SocialItemSchema>;
export type SocialSettingsShape = z.infer<typeof SocialSettingsSchema>;
