/**
 * @file packages/validation/src/site/seo/seo.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme frontière des réglages SEO du site.
 */

import { z } from "zod";

import { SEO } from "@compoz/core/constants/limits/seo";
import {
  TITLE_PLACEHOLDER,
  TWITTER_CARD_TYPES,
} from "@compoz/core/constants/seo/seo";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  AbsoluteHttpUrlSchema,
  AssetUrlSchema,
} from "@compoz/validation/common/url-fragments";

const REQUIRE_BASEURL_HTTPS = process.env.NODE_ENV === "production";

/* -------------------------------------------------------------------------- */
/*                         Helpers draft ("" accepté)                         */
/* -------------------------------------------------------------------------- */

export const OptionalAbsoluteHttpUrlDraftSchema = z
  .union([AbsoluteHttpUrlSchema, z.literal("")])
  .optional();

export const OptionalAssetUrlDraftSchema = z
  .union([AssetUrlSchema, z.literal("")])
  .optional();

/* -------------------------------------------------------------------------- */
/*                                OpenGraph                                   */
/* -------------------------------------------------------------------------- */

export const OpenGraphSettingsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_OPEN_GRAPH_TITLE_TOO_LONG)
      .optional(),

    description: z
      .string()
      .trim()
      .max(SEO.DESCRIPTION.MAX, ERROR_CODES.SEO_OPEN_GRAPH_DESCRIPTION_TOO_LONG)
      .optional(),

    defaultImageUrl: OptionalAssetUrlDraftSchema,

    imageAlt: z
      .string()
      .trim()
      .max(SEO.IMAGE_ALT_MAX, ERROR_CODES.SEO_OPEN_GRAPH_IMAGE_ALT_TOO_LONG)
      .optional(),
  })
  .strict();

export type OpenGraphSettingsShape = z.infer<typeof OpenGraphSettingsSchema>;

/* -------------------------------------------------------------------------- */
/*                                Twitter                                     */
/* -------------------------------------------------------------------------- */

export const TwitterHandleSchema = z
  .string()
  .trim()
  .refine((s) => /^@?[A-Za-z0-9_]{1,15}$/.test(s), {
    message: ERROR_CODES.SEO_TWITTER_HANDLE_INVALID,
  });

export const OptionalTwitterHandleDraftSchema = z
  .union([TwitterHandleSchema, z.literal("")])
  .optional();

export const TwitterSettingsSchema = z
  .object({
    card: z.enum(TWITTER_CARD_TYPES),
    site: OptionalTwitterHandleDraftSchema,
    creator: OptionalTwitterHandleDraftSchema,
  })
  .strict();

export type TwitterSettingsShape = z.infer<typeof TwitterSettingsSchema>;

/* -------------------------------------------------------------------------- */
/*                               Inline validation                            */
/* -------------------------------------------------------------------------- */

function validateSeoSettingsValues(
  val: z.infer<typeof SeoSettingsObjectSchema>,
  ctx: z.RefinementCtx,
) {
  // defaultTitle requis
  const title = val.defaultTitle.trim();
  if (title.length < SEO.TITLE.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTitle"],
      message: ERROR_CODES.SEO_TITLE_REQUIRED,
    });
  }

  // baseUrl https requis en prod
  const baseUrl = (val.baseUrl ?? "").trim();
  if (baseUrl.length > 0 && REQUIRE_BASEURL_HTTPS) {
    try {
      const { protocol } = new URL(baseUrl);
      if (protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["baseUrl"],
          message: ERROR_CODES.SEO_BASEURL_HTTPS_REQUIRED,
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseUrl"],
        message: ERROR_CODES.SEO_BASEURL_INVALID,
      });
    }
  }

  // defaultDescription si renseignée => min
  const desc = (val.defaultDescription ?? "").trim();
  if (desc.length > 0 && desc.length < SEO.DESCRIPTION.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultDescription"],
      message: ERROR_CODES.SEO_DEFAULT_DESCRIPTION_TOO_SHORT,
    });
  }

  // titleTemplate si renseigné => min + placeholder
  const tpl = (val.titleTemplate ?? "").trim();
  if (tpl.length > 0) {
    if (tpl.length < SEO.TITLE_TEMPLATE.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["titleTemplate"],
        message: ERROR_CODES.SEO_TITLE_TEMPLATE_TOO_SHORT,
      });
    }
    if (!tpl.includes(TITLE_PLACEHOLDER)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["titleTemplate"],
        message: ERROR_CODES.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           Schéma principal SEO                              */
/* -------------------------------------------------------------------------- */

const SeoSettingsObjectSchema = z
  .object({
    baseUrl: OptionalAbsoluteHttpUrlDraftSchema,

    defaultTitle: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_TITLE_TOO_LONG),

    defaultDescription: z
      .string()
      .trim()
      .max(SEO.DESCRIPTION.MAX, ERROR_CODES.SEO_DESCRIPTION_TOO_LONG)
      .optional(),

    titleTemplate: z
      .string()
      .trim()
      .max(SEO.TITLE_TEMPLATE.MAX, ERROR_CODES.SEO_TITLE_TEMPLATE_TOO_LONG)
      .optional(),

    canonicalUrl: OptionalAbsoluteHttpUrlDraftSchema,

    robots: z
      .string()
      .trim()
      .max(SEO.ROBOTS.MAX, ERROR_CODES.SEO_ROBOTS_TOO_LONG)
      .optional(),

    openGraph: OpenGraphSettingsSchema.optional(),
    twitter: TwitterSettingsSchema.optional(),

    structuredDataEnabled: z.boolean().optional(),
  })
  .strict();

export const SeoSettingsSchema = SeoSettingsObjectSchema.superRefine(
  validateSeoSettingsValues,
);

export type SeoSettingsShape = z.infer<typeof SeoSettingsSchema>;
