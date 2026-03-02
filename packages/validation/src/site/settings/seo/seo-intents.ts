/**
 * @file packages/validation/src/site/settings/seo/seo-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux réglages SEO.
 * Ces schémas valident uniquement la structure des payloads ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { TWITTER_CARD_TYPES } from "@compoz/core/constants/seo/seo";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { withOptionalState } from "@compoz/validation/_shared/builders";
import {
  AbsoluteHttpUrlSchema,
  AssetUrlSchema,
} from "@compoz/validation/common/url-fragments";
import { SeoSettingsSchema } from "@compoz/validation/site/settings/seo/seo";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Helpers clearables                                */
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

/* -------------------------------------------------------------------------- */
/*                                    Zod                                     */
/* -------------------------------------------------------------------------- */

/**
 * Intention de mise à jour des réglages SEO.
 * Contrat : payload partiel aligné sur la forme des settings, avec état optionnel
 * et clearabilité des champs acceptée.
 */
export const UpdateSeoSettingsIntentSchema = withOptionalState(
  SeoSettingsSchema,
)
  .extend({
    baseUrl: AbsoluteHttpUrlPatchableSchema.optional(),
    canonicalUrl: AbsoluteHttpUrlPatchableSchema.optional(),

    defaultDescription: ClearableStringSchema.optional(),
    titleTemplate: ClearableStringSchema.optional(),
    robots: ClearableStringSchema.optional(),

    // ✅ V0.5 : objet patchable uniquement (pas null)
    openGraph: OpenGraphPatchSchema.optional(),
    twitter: TwitterPatchSchema.optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * DTO d’intention : résultat typé du parsing du payload SEO.
 */
export type UpdateSeoSettingsIntentDTO = z.infer<
  typeof UpdateSeoSettingsIntentSchema
>;
