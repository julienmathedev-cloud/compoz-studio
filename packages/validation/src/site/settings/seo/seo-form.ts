/**
 * @file packages/validation/src/site/settings/seo/seo-form.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme du formulaire SEO côté UI (admin / RHF).
 * UI = strings stables (draft), donc "" est accepté sur les champs “optionnels”.
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
/*                              Helpers draft (UI)                            */
/* -------------------------------------------------------------------------- */

/**
 * URL http(s) absolue en “draft UI” :
 * - "" accepté
 * - sinon URL absolue http/https valide
 */
function absoluteHttpUrlDraftFormSchema(message: string) {
  return z
    .string()
    .trim()
    .refine((s) => s === "" || AbsoluteHttpUrlSchema.safeParse(s).success, {
      message,
    });
}

/**
 * URL asset en “draft UI” :
 * - "" accepté
 * - sinon asset URL valide (absolute http/https OU relative "/...")
 */
export const AssetUrlDraftFormSchema = z
  .string()
  .trim()
  .refine((s) => s === "" || AssetUrlSchema.safeParse(s).success, {
    message: ERROR_CODES.SEO_ASSET_URL_INVALID,
  });

export const BaseUrlDraftFormSchema = absoluteHttpUrlDraftFormSchema(
  ERROR_CODES.SEO_BASEURL_INVALID,
);

export const CanonicalUrlDraftFormSchema = absoluteHttpUrlDraftFormSchema(
  ERROR_CODES.SEO_CANONICAL_URL_INVALID,
);

/* -------------------------------------------------------------------------- */
/*                              OpenGraph (UI)                                */
/* -------------------------------------------------------------------------- */

export const SeoOpenGraphFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_OPEN_GRAPH_TITLE_TOO_LONG),

    description: z
      .string()
      .trim()
      .max(
        SEO.DESCRIPTION.MAX,
        ERROR_CODES.SEO_OPEN_GRAPH_DESCRIPTION_TOO_LONG,
      ),

    defaultImageUrl: AssetUrlDraftFormSchema,

    imageAlt: z
      .string()
      .trim()
      .max(SEO.IMAGE_ALT_MAX, ERROR_CODES.SEO_OPEN_GRAPH_IMAGE_ALT_TOO_LONG),
  })
  .strict();

export type SeoOpenGraphFormValues = z.infer<typeof SeoOpenGraphFormSchema>;

/* -------------------------------------------------------------------------- */
/*                               Twitter (UI)                                 */
/* -------------------------------------------------------------------------- */

export const TwitterHandleFormSchema = z
  .string()
  .trim()
  .refine((s) => s === "" || /^@?[A-Za-z0-9_]{1,15}$/.test(s), {
    message: ERROR_CODES.SEO_TWITTER_HANDLE_INVALID,
  });

export const SeoTwitterFormSchema = z
  .object({
    card: z.enum(TWITTER_CARD_TYPES),
    site: TwitterHandleFormSchema,
    creator: TwitterHandleFormSchema,
  })
  .strict();

export type SeoTwitterFormValues = z.infer<typeof SeoTwitterFormSchema>;

/* -------------------------------------------------------------------------- */
/*                               Inline validation                            */
/* -------------------------------------------------------------------------- */

function validateSeoFormValues(
  val: z.infer<typeof SeoFormObjectSchema>,
  ctx: z.RefinementCtx,
) {
  // --- defaultTitle requis ---
  const title = val.defaultTitle.trim();
  if (title.length < SEO.TITLE.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTitle"],
      message: ERROR_CODES.SEO_TITLE_REQUIRED,
    });
  }

  // --- defaultDescription : si renseignée, min ---
  const desc = val.defaultDescription.trim();
  if (desc.length > 0 && desc.length < SEO.DESCRIPTION.MIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultDescription"],
      message: ERROR_CODES.SEO_DEFAULT_DESCRIPTION_TOO_SHORT,
    });
  }

  // --- titleTemplate : si renseigné, min + placeholder ---
  const tpl = val.titleTemplate.trim();
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

  // --- baseUrl : https requis en prod ---
  const REQUIRE_BASEURL_HTTPS = process.env.NODE_ENV === "production";
  const baseUrl = val.baseUrl.trim();

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
      // fallback défensif (normalement déjà capté par BaseUrlDraftFormSchema)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseUrl"],
        message: ERROR_CODES.SEO_BASEURL_INVALID,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                               Form schema (UI)                             */
/* -------------------------------------------------------------------------- */

const SeoFormObjectSchema = z
  .object({
    baseUrl: BaseUrlDraftFormSchema,

    defaultTitle: z
      .string()
      .trim()
      .max(SEO.TITLE.MAX, ERROR_CODES.SEO_TITLE_TOO_LONG),

    defaultDescription: z
      .string()
      .trim()
      .max(SEO.DESCRIPTION.MAX, ERROR_CODES.SEO_DESCRIPTION_TOO_LONG),

    titleTemplate: z
      .string()
      .trim()
      .max(SEO.TITLE_TEMPLATE.MAX, ERROR_CODES.SEO_TITLE_TEMPLATE_TOO_LONG),

    canonicalUrl: CanonicalUrlDraftFormSchema,

    robots: z
      .string()
      .trim()
      .max(SEO.ROBOTS.MAX, ERROR_CODES.SEO_ROBOTS_TOO_LONG),

    structuredDataEnabled: z.boolean(),

    openGraph: SeoOpenGraphFormSchema,
    twitter: SeoTwitterFormSchema,
  })
  .strict();

export const SeoFormSchema = SeoFormObjectSchema.superRefine(
  validateSeoFormValues,
);

export type SeoFormValues = z.infer<typeof SeoFormSchema>;
