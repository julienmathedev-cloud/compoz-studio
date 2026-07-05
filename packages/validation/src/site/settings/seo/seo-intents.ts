/**
 * @file packages/validation/src/site/settings/seo/seo-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages SEO.
 * Ces schémas valident uniquement la structure des payloads ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

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
import {
  SeoSettingsObjectSchema,
  StructuredDataEntityTypeSchema,
} from "@compoz/validation/site/settings/seo/seo";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Helpers clearables                               */
/* -------------------------------------------------------------------------- */

const ClearableStringSchema = z.union([z.string(), z.literal(""), z.null()]);

const AbsoluteHttpUrlPatchableSchema = z.union([
  AbsoluteHttpUrlSchema,
  z.literal(""),
  z.null(),
]);

const AssetUrlPatchableSchema = z.union([
  AssetUrlSchema,
  z.literal(""),
  z.null(),
]);

const TwitterHandleClearableSchema = z.union([
  z
    .string()
    .trim()
    .refine((s) => /^@?[A-Za-z0-9_]{1,15}$/.test(s), {
      message: ERROR_CODES.SEO_TWITTER_HANDLE_INVALID,
    }),
  z.literal(""),
  z.null(),
]);

/* -------------------------------------------------------------------------- */
/*                        Patch schemas (exportés)                            */
/* -------------------------------------------------------------------------- */

export const TwitterPatchSchema = z
  .object({
    card: z.enum(TWITTER_CARD_TYPES).optional(),
    site: TwitterHandleClearableSchema.optional(),
    creator: TwitterHandleClearableSchema.optional(),
  })
  .strict();

export const OpenGraphPatchSchema = z
  .object({
    title: ClearableStringSchema.optional(),
    description: ClearableStringSchema.optional(),
    defaultImageUrl: AssetUrlPatchableSchema.optional(),
    defaultImageMediaAssetId: z.string().trim().min(1).optional(),
    imageAlt: ClearableStringSchema.optional(),
  })
  .strict();

export const StructuredDataAddressPatchSchema = z
  .object({
    streetAddress: ClearableStringSchema.optional(),
    postalCode: ClearableStringSchema.optional(),
    addressLocality: ClearableStringSchema.optional(),
    addressRegion: ClearableStringSchema.optional(),
    addressCountry: ClearableStringSchema.optional(),
  })
  .strict();

export const StructuredDataPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    entityType: StructuredDataEntityTypeSchema.optional(),
    name: ClearableStringSchema.optional(),
    description: ClearableStringSchema.optional(),
    telephone: ClearableStringSchema.optional(),
    email: ClearableStringSchema.optional(),
    address: StructuredDataAddressPatchSchema.optional(),
    areaServed: z.array(ClearableStringSchema).optional(),
    priceRange: ClearableStringSchema.optional(),
    openingHours: z.array(ClearableStringSchema).optional(),
  })
  .strict();

export type OpenGraphPatchDTO = z.infer<typeof OpenGraphPatchSchema>;
export type TwitterPatchDTO = z.infer<typeof TwitterPatchSchema>;
export type StructuredDataAddressPatchDTO = z.infer<
  typeof StructuredDataAddressPatchSchema
>;
export type StructuredDataPatchDTO = z.infer<typeof StructuredDataPatchSchema>;

const UpdateSeoSettingsIntentObjectSchema = SeoSettingsObjectSchema.partial()
  .extend({
    baseUrl: AbsoluteHttpUrlPatchableSchema.optional(),
    canonicalUrl: AbsoluteHttpUrlPatchableSchema.optional(),

    defaultTitle: ClearableStringSchema.optional(),
    defaultDescription: ClearableStringSchema.optional(),
    titleTemplate: ClearableStringSchema.optional(),
    robots: ClearableStringSchema.optional(),

    openGraph: z.union([OpenGraphPatchSchema, z.null()]).optional(),
    twitter: z.union([TwitterPatchSchema, z.null()]).optional(),

    structuredData: z
      .union([StructuredDataPatchSchema, z.boolean()])
      .optional(),
    structuredDataEnabled: z.boolean().optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                    Zod                                     */
/* -------------------------------------------------------------------------- */

export type SeoIntentValidationOptions = {
  /**
   * Si `true`, baseUrl (si fournie dans le patch) doit être en https.
   * Cette règle est runtime-dependent et doit être injectée depuis l'appelant (ex: route).
   */
  requireBaseUrlHttps?: boolean;
};

type UpdateSeoIntentShape = z.infer<typeof UpdateSeoSettingsIntentObjectSchema>;

/**
 * Validation "patch-aware" :
 * - n'applique les règles que si les champs concernés sont présents dans le payload.
 *
 * @remarks
 * On reconstruit un objet "complet" minimal, puis on y injecte le patch.
 */
export function validateSeoSettingsPatchValues(
  patch: UpdateSeoIntentShape,
  ctx: z.RefinementCtx,
  opts?: SeoIntentValidationOptions,
) {
  const requireBaseUrlHttps = opts?.requireBaseUrlHttps ?? false;

  const base: z.infer<typeof SeoSettingsObjectSchema> = {
    baseUrl: null,
    canonicalUrl: null,
    defaultTitle: null,
    defaultDescription: null,
    titleTemplate: null,
    robots: null,
    openGraph: null,
    twitter: null,
    structuredData: {
      enabled: false,
      entityType: "organization",
    },
  };

  const merged = { ...base, ...patch };

  if (Object.prototype.hasOwnProperty.call(patch, "defaultTitle")) {
    const title =
      typeof merged.defaultTitle === "string" ? merged.defaultTitle.trim() : "";

    if (title.length > 0 && title.length < SEO.TITLE.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultTitle"],
        message: ERROR_CODES.SEO_TITLE_REQUIRED,
      });
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "baseUrl")) {
    const baseUrl =
      typeof merged.baseUrl === "string" ? merged.baseUrl.trim() : "";

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
  }

  if (Object.prototype.hasOwnProperty.call(patch, "defaultDescription")) {
    const desc =
      typeof merged.defaultDescription === "string"
        ? merged.defaultDescription.trim()
        : "";

    if (desc.length > 0 && desc.length < SEO.DESCRIPTION.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultDescription"],
        message: ERROR_CODES.SEO_DEFAULT_DESCRIPTION_TOO_SHORT,
      });
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "titleTemplate")) {
    const tpl =
      typeof merged.titleTemplate === "string"
        ? merged.titleTemplate.trim()
        : "";

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
}

/**
 * Factory : schéma d’intention SEO configurable via options runtime.
 */
export function createUpdateSeoSettingsIntentSchema(
  opts?: SeoIntentValidationOptions,
) {
  return UpdateSeoSettingsIntentObjectSchema.superRefine((patch, ctx) =>
    validateSeoSettingsPatchValues(patch, ctx, opts),
  );
}

/**
 * Intention de mise à jour des réglages SEO (neutre, sans dépendance runtime).
 */
export const UpdateSeoSettingsIntentSchema =
  createUpdateSeoSettingsIntentSchema();

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** DTO d’intention : résultat typé du parsing du payload SEO. */
export type UpdateSeoSettingsIntentDTO = z.infer<
  typeof UpdateSeoSettingsIntentSchema
>;
