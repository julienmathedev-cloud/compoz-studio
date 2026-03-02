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
import { SeoSettingsObjectSchema } from "@compoz/validation/site/settings/seo/seo";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Helpers clearables                                */
/* -------------------------------------------------------------------------- */

const ClearableStringSchema = z.union([z.string(), z.literal("")]);

const AbsoluteHttpUrlPatchableSchema = z.union([
  AbsoluteHttpUrlSchema,
  z.literal(""),
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
/*                        Patch schemas (exportés)                             */
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
    imageAlt: ClearableStringSchema.optional(),
  })
  .strict();

export type OpenGraphPatchDTO = z.infer<typeof OpenGraphPatchSchema>;
export type TwitterPatchDTO = z.infer<typeof TwitterPatchSchema>;

const UpdateSeoSettingsIntentObjectSchema = SeoSettingsObjectSchema.partial()
  .extend({
    baseUrl: AbsoluteHttpUrlPatchableSchema.optional(),
    canonicalUrl: AbsoluteHttpUrlPatchableSchema.optional(),

    defaultDescription: ClearableStringSchema.optional(),
    titleTemplate: ClearableStringSchema.optional(),
    robots: ClearableStringSchema.optional(),

    openGraph: OpenGraphPatchSchema.optional(),
    twitter: TwitterPatchSchema.optional(),

    structuredDataEnabled: z.boolean().optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                    Zod                                     */
/* -------------------------------------------------------------------------- */
const REQUIRE_BASEURL_HTTPS = process.env.NODE_ENV === "production";
type UpdateSeoIntentShape = z.infer<typeof UpdateSeoSettingsIntentObjectSchema>;
/**
 * Validation "patch-aware" :
 * - n'applique les règles que si les champs concernés sont présents dans le payload.
 *
 * @remarks
 * On réutilise la validation full (`validateSeoSettingsValues`) en construisant un objet
 * complet avec des valeurs par défaut, puis en y injectant le patch.
 */
export function validateSeoSettingsPatchValues(
  patch: UpdateSeoIntentShape,
  ctx: z.RefinementCtx,
) {
  // On reconstruit un objet "complet" minimal qui satisfait les types attendus
  // par validateSeoSettingsValues, puis on injecte le patch.
  const base: z.infer<typeof SeoSettingsObjectSchema> = {
    baseUrl: "",
    canonicalUrl: "",
    defaultTitle: "",
    defaultDescription: undefined,
    titleTemplate: undefined,
    robots: undefined,
    openGraph: undefined,
    twitter: undefined,
    structuredDataEnabled: undefined,
  };

  const merged = { ...base, ...patch };

  // 1) defaultTitle requis uniquement si patch le contient
  if (Object.prototype.hasOwnProperty.call(patch, "defaultTitle")) {
    const title = (merged.defaultTitle ?? "").trim();
    if (title.length < SEO.TITLE.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultTitle"],
        message: ERROR_CODES.SEO_TITLE_REQUIRED,
      });
    }
  }

  // 2) baseUrl https requis en prod uniquement si patch le contient
  if (Object.prototype.hasOwnProperty.call(patch, "baseUrl")) {
    const baseUrl = (merged.baseUrl ?? "").trim();
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
  }

  // 3) defaultDescription min uniquement si patch le contient
  if (Object.prototype.hasOwnProperty.call(patch, "defaultDescription")) {
    const desc = (merged.defaultDescription ?? "").trim();
    if (desc.length > 0 && desc.length < SEO.DESCRIPTION.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultDescription"],
        message: ERROR_CODES.SEO_DEFAULT_DESCRIPTION_TOO_SHORT,
      });
    }
  }

  // 4) titleTemplate min + placeholder uniquement si patch le contient
  if (Object.prototype.hasOwnProperty.call(patch, "titleTemplate")) {
    const tpl = (merged.titleTemplate ?? "").trim();
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
 * Intention de mise à jour des réglages SEO.
 * Contrat : payload partiel aligné sur la forme des settings, avec état optionnel
 * et clearabilité des champs acceptée.
 */
export const UpdateSeoSettingsIntentSchema =
  UpdateSeoSettingsIntentObjectSchema.superRefine(
    validateSeoSettingsPatchValues,
  );

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * DTO d’intention : résultat typé du parsing du payload SEO.
 */
export type UpdateSeoSettingsIntentDTO = z.infer<
  typeof UpdateSeoSettingsIntentSchema
>;
