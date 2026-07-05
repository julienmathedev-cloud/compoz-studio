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

/* -------------------------------------------------------------------------- */
/*                         Helpers draft ("" accepté)                         */
/* -------------------------------------------------------------------------- */

export const OptionalAbsoluteHttpUrlDraftSchema = z.union([
  AbsoluteHttpUrlSchema,
  z.literal(""),
  z.null(),
]);

export const OptionalAssetUrlDraftSchema = z.union([
  AssetUrlSchema,
  z.literal(""),
  z.null(),
]);

/* -------------------------------------------------------------------------- */
/*                                OpenGraph                                   */
/* -------------------------------------------------------------------------- */

export const OpenGraphSettingsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_OPEN_GRAPH_TITLE_TOO_LONG)
      .nullable(),

    description: z
      .string()
      .trim()
      .max(SEO.DESCRIPTION.MAX, ERROR_CODES.SEO_OPEN_GRAPH_DESCRIPTION_TOO_LONG)
      .nullable(),

    defaultImageUrl: OptionalAssetUrlDraftSchema,

    defaultImageMediaAssetId: z.string().trim().min(1).optional(),

    imageAlt: z
      .string()
      .trim()
      .max(SEO.IMAGE_ALT.MAX, ERROR_CODES.SEO_OPEN_GRAPH_IMAGE_ALT_TOO_LONG),
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

export const OptionalTwitterHandleDraftSchema = z.union([
  TwitterHandleSchema,
  z.literal(""),
  z.null(),
]);

export const TwitterSettingsSchema = z
  .object({
    card: z.enum(TWITTER_CARD_TYPES),
    site: OptionalTwitterHandleDraftSchema,
    creator: OptionalTwitterHandleDraftSchema,
  })
  .strict();

export type TwitterSettingsShape = z.infer<typeof TwitterSettingsSchema>;

/* -------------------------------------------------------------------------- */
/*                           Structured data                                  */
/* -------------------------------------------------------------------------- */

const OptionalStructuredDataStringSchema = z.string().trim().min(1).optional();

export const StructuredDataEntityTypeSchema = z.enum([
  "person",
  "organization",
  "localBusiness",
  "professionalService",
  "visualArtist",
  "autoRepair",
]);

export const StructuredDataAddressSchema = z
  .object({
    streetAddress: OptionalStructuredDataStringSchema,
    postalCode: OptionalStructuredDataStringSchema,
    addressLocality: OptionalStructuredDataStringSchema,
    addressRegion: OptionalStructuredDataStringSchema,
    addressCountry: OptionalStructuredDataStringSchema,
  })
  .strict();

export const StructuredDataSettingsSchema = z
  .object({
    enabled: z.boolean(),
    entityType: StructuredDataEntityTypeSchema,
    name: OptionalStructuredDataStringSchema,
    description: OptionalStructuredDataStringSchema,
    telephone: OptionalStructuredDataStringSchema,
    email: OptionalStructuredDataStringSchema,
    address: StructuredDataAddressSchema.optional(),
    areaServed: z.array(z.string().trim().min(1)).optional(),
    priceRange: OptionalStructuredDataStringSchema,
    openingHours: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export type StructuredDataSettingsShape = z.infer<
  typeof StructuredDataSettingsSchema
>;

/* -------------------------------------------------------------------------- */
/*                               Inline validation                            */
/* -------------------------------------------------------------------------- */

type SeoSettingsDraft = z.infer<typeof SeoSettingsObjectSchema>;

export function validateSeoSettingsValues(
  val: SeoSettingsDraft,
  ctx: z.RefinementCtx,
  opts?: { requireBaseUrlHttps?: boolean },
) {
  const requireBaseUrlHttps = opts?.requireBaseUrlHttps ?? false;

  const title = val.defaultTitle !== null ? val.defaultTitle.trim() : "";
  if (title.length < SEO.TITLE.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTitle"],
      message: ERROR_CODES.SEO_TITLE_REQUIRED,
    });
  }

  const baseUrl = typeof val.baseUrl === "string" ? val.baseUrl.trim() : "";
  if (baseUrl.length > 0) {
    try {
      const { protocol } = new URL(baseUrl);
      if (requireBaseUrlHttps && protocol !== "https:") {
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

  const desc =
    val.defaultDescription !== null ? val.defaultDescription.trim() : "";
  if (desc.length > 0 && desc.length < SEO.DESCRIPTION.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultDescription"],
      message: ERROR_CODES.SEO_DEFAULT_DESCRIPTION_TOO_SHORT,
    });
  }

  const tpl = val.titleTemplate !== null ? val.titleTemplate.trim() : "";
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

export const SeoSettingsObjectSchema = z
  .object({
    baseUrl: OptionalAbsoluteHttpUrlDraftSchema,

    defaultTitle: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_TITLE_TOO_LONG)
      .nullable(),

    defaultDescription: z
      .string()
      .trim()
      .max(SEO.DESCRIPTION.MAX, ERROR_CODES.SEO_DESCRIPTION_TOO_LONG)
      .nullable(),

    titleTemplate: z
      .string()
      .trim()
      .max(SEO.TITLE_TEMPLATE.MAX, ERROR_CODES.SEO_TITLE_TEMPLATE_TOO_LONG)
      .nullable(),

    canonicalUrl: OptionalAbsoluteHttpUrlDraftSchema,

    robots: z
      .string()
      .trim()
      .max(SEO.ROBOTS.MAX, ERROR_CODES.SEO_ROBOTS_TOO_LONG)
      .nullable(),

    openGraph: OpenGraphSettingsSchema.nullable(),

    twitter: TwitterSettingsSchema.nullable(),

    structuredData: StructuredDataSettingsSchema,
  })
  .strict();

export const SeoSettingsSchema = SeoSettingsObjectSchema.superRefine(
  (val, ctx) => validateSeoSettingsValues(val, ctx),
);

export type SeoSettingsShape = z.infer<typeof SeoSettingsSchema>;
