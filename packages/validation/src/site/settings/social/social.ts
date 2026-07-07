/**
 * @file packages/validation/src/site/settings/social/social.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the social settings boundary shape.
 *
 * @remarks
 * These schemas validate canonical settings payloads. Draft-friendly values,
 * such as empty strings while editing, belong to the form schema.
 *
 * Email items must use `mailto:` links. Other social items must use absolute
 * HTTP URLs.
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

const SocialKindSchema = z.enum(SOCIAL_KINDS);

const MailtoHrefSchema = z.string().trim().refine(isMailtoHref, {
  message: ERROR_CODES.SOCIAL_MAILTO_INVALID,
});

export const SocialItemSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.SOCIAL_ID_REQUIRED),
    kind: SocialKindSchema,
    href: z.string().trim().min(1, ERROR_CODES.SOCIAL_HREF_REQUIRED),
  })
  .strict()
  .superRefine((val, ctx) => {
    const href = val.href.trim();

    const isMailto = MailtoHrefSchema.safeParse(href).success;

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

    if (isMailto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_MAILTO_RESERVED_FOR_EMAIL,
      });
      return;
    }

    const isAbs = AbsoluteHttpUrlSchema.safeParse(href).success;
    if (!isAbs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_ABSOLUTE_REQUIRED,
      });
    }
  });

export const SocialSettingsSchema = z
  .object({
    items: z
      .array(SocialItemSchema)
      .max(SOCIAL_ITEM.MAX, ERROR_CODES.SOCIAL_TOO_MANY_ITEMS),
  })
  .strict();

export type SocialItemShape = z.infer<typeof SocialItemSchema>;
export type SocialSettingsShape = z.infer<typeof SocialSettingsSchema>;
