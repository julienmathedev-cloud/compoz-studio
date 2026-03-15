/**
 * @file packages/validation/src/pages/page-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux pages.
 * Ces schémas valident uniquement la structure des payloads (API / UI) ; les règles
 * métier et décisions de cohérence sont traitées dans le domaine.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  PageIdSchema,
  PageNameSchema,
  SitemapChangeFreqSchema,
  SlugSchema,
} from "@compoz/validation/pages/page";
import { z } from "zod";

/**
 * Patch sitemap côté API :
 * - Champs optionnels (patch partiel)
 * - `null` permet d’« unset » certains champs (ex: priority)
 */
const PageSitemapIntentSchema = z
  .object({
    include: z.boolean().optional(),
    changefreq: SitemapChangeFreqSchema.nullable().optional(),
    priority: z
      .union([
        z
          .number()
          .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
          .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE),
        z.null(),
      ])
      .optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            Intentions HTTP API                             */
/* -------------------------------------------------------------------------- */

/** Intention de création d’une page. */
export const CreatePageIntentSchema = z
  .object({
    /** Titre de la page (requis côté API). */
    name: PageNameSchema,
    parentId: PageIdSchema.nullable(),
    /** Slug optionnel : normalisation + unicité gérées dans le domaine. */
    slug: z.union([SlugSchema, z.literal("/")]).optional(),
    /** Bloc sitemap partiel autorisé (defaults appliqués côté domaine). */
    sitemap: PageSitemapIntentSchema.optional(),
    paginationEnabled: z.boolean(),
  })
  .strict();

export type CreatePageIntentDTO = z.infer<typeof CreatePageIntentSchema>;

/** Intention de mise à jour d’une page existante. */
export const UpdatePageIntentSchema = z
  .object({
    /**
     * Nouveau nom de la page. Optionnel :
     * absence de clé ⇒ titre inchangé.
     */
    name: PageNameSchema.optional(),
    parentId: PageIdSchema.nullable().optional(),
    /**
     * Nouveau slug optionnel. Collisions, normalisation et réservations sont
     * gérées dans le domaine (use-case `updatePage`).
     */
    slug: z.union([SlugSchema, z.literal(""), z.literal("/")]).optional(),
    /** Bloc sitemap partiel (include/changefreq/priority). */
    sitemap: PageSitemapIntentSchema.optional(),
    paginationEnabled: z.boolean().optional(),
  })
  .strict();

export type UpdatePageIntentDTO = z.infer<typeof UpdatePageIntentSchema>;

export const ReorderChildrenIntentSchema = z
  .object({
    childIds: z.array(PageIdSchema).min(1),
  })
  .strict();

export type ReorderChildrenIntentDTO = z.infer<
  typeof ReorderChildrenIntentSchema
>;
