/**
 * @file packages/validation/src/pages/page-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux pages.
 * Ces schémas valident uniquement la structure des payloads (API / UI) ; les règles
 * métier et décisions de cohérence sont traitées dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  PageIdSchema,
  PageNameSchema,
  PageSeoTitleSchema,
  SitemapChangeFreqSchema,
  SlugSchema,
} from "@compoz/validation/pages/page";

/**
 * Patch sitemap côté API :
 * - Champs optionnels (patch partiel)
 * - `null` permet d’unset certains champs
 * - absence de clé => ne pas modifier
 */
const PageSitemapIntentSchema = z
  .object({
    include: z.boolean().optional(),
    changefreq: SitemapChangeFreqSchema.nullable().optional(),
    priority: z
      .number()
      .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .nullable()
      .optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            Intentions HTTP API                             */
/* -------------------------------------------------------------------------- */

/** Intention de création d’une page. */
export const CreatePageIntentSchema = z
  .object({
    /** Nom de la page (requis côté API). */
    name: PageNameSchema,

    /** Titre SEO explicite ou null. */
    seoTitle: PageSeoTitleSchema,

    parentId: PageIdSchema.nullable(),

    /**
     * Slug optionnel :
     * - absence => génération / normalisation côté domaine
     * - "/" autorisé pour la page d’accueil
     */
    slug: z.union([SlugSchema, z.literal("/")]).optional(),

    /**
     * Sitemap :
     * - null = pas de config sitemap explicite
     * - objet = config fournie
     */
    sitemap: PageSitemapIntentSchema.nullable(),

    paginationEnabled: z.boolean(),
  })
  .strict();

export type CreatePageIntentDTO = z.infer<typeof CreatePageIntentSchema>;

/** Intention de mise à jour d’une page existante. */
export const UpdatePageIntentSchema = z
  .object({
    /**
     * Absence de clé => nom inchangé
     */
    name: PageNameSchema.optional(),

    /**
     * Absence => inchangé
     * null => vider explicitement
     */
    seoTitle: PageSeoTitleSchema.optional(),

    /**
     * Absence => inchangé
     * null => page racine
     */
    parentId: PageIdSchema.nullable().optional(),

    /**
     * Absence => inchangé
     * "" / "/" gardés pour le flow UI existant
     */
    slug: z.union([SlugSchema, z.literal(""), z.literal("/")]).optional(),

    /**
     * Absence => inchangé
     * null => supprimer la config sitemap
     * objet => patch partiel
     */
    sitemap: PageSitemapIntentSchema.nullable().optional(),

    /**
     * Absence => inchangé
     */
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
