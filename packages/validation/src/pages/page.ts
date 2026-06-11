/**
 * @file packages/validation/src/pages/page.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière d’une page.
 * Ces schémas valident uniquement la structure des données exposées (API / infra) ;
 * les invariants métier et règles globales sont traités dans le domaine.
 */

import { z } from "zod";

import {
  PAGE_NAME,
  PAGE_SEO_DESCRIPTION,
  PAGE_SEO_TITLE,
} from "@compoz/core/constants/limits/pages";
import { SLUG } from "@compoz/core/constants/limits/slug";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { isReservedSlug } from "@compoz/core/domain/slug/utils";
import { IsoDateStringSchema } from "@compoz/validation/common/date";
import { BlockSchema } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

/** Slug kebab-case strict + non réservé. */
export const SlugSchema = z
  .string()
  .trim()
  .min(SLUG.MIN, ERROR_CODES.PAGE_SLUG_REQUIRED)
  .regex(SLUG_FINAL_RE, ERROR_CODES.PAGE_SLUG_INVALID_FORMAT)
  .refine((s) => !isReservedSlug(s), ERROR_CODES.PAGE_SLUG_RESERVED);

/**
 * Nom de page :
 * - trim automatique
 * - bornes min/max alignées sur `PAGE_NAME`
 */
export const PageNameSchema = z
  .string()
  .trim()
  .min(PAGE_NAME.MIN, ERROR_CODES.PAGE_TITLE_TOO_SHORT)
  .max(PAGE_NAME.MAX, ERROR_CODES.PAGE_TITLE_TOO_LONG);

/**
 * Titre SEO :
 * - trim automatique
 * - null autorisé pour représenter l’absence de valeur
 * - borne max alignée sur `PAGE_NAME`
 */
export const PageSeoTitleSchema = z
  .string()
  .trim()
  .max(PAGE_SEO_TITLE.MAX, ERROR_CODES.PAGE_TITLE_TOO_LONG)
  .nullable();

/**
 * Description SEO :
 * - trim automatique
 * - null autorisé pour représenter l’absence de valeur
 * - borne max adaptée aux résultats de recherche
 */
export const PageSeoDescriptionSchema = z
  .string()
  .trim()
  .max(PAGE_SEO_DESCRIPTION.MAX, ERROR_CODES.SEO_DESCRIPTION_TOO_LONG)
  .nullable();

/**
 * Id technique d'une Page.
 *
 * Contrat :
 * - trim
 * - non vide
 *
 * @remarks
 * À ce stade on ne contraint pas le format (uuid, prefix, etc.)
 * car l’infra peut évoluer (FS, DB, migration).
 * Si tu figes un format d’id (ex: `pg_` + uuid), on renforcera ici.
 */
export const PageIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.PAGE_ID_REQUIRED);

export const PageParentIdSchema = z.union([PageIdSchema, z.null()]);

export const PageIdParamSchema = z.object({ pageId: PageIdSchema }).strict();

/**
 * Param route : un parentId d’URL ne peut pas être null (contrairement à `parentId` dans la doc Page).
 */
export const PageParentIdParamSchema = z
  .object({ parentId: PageIdSchema })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Schémas blocs                               */
/* -------------------------------------------------------------------------- */

/** Fréquences sitemap (SoT minimal, aligné sur le domaine). */
export const SitemapChangeFreqSchema = z.enum([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const);

/** Bloc sitemap (forme frontière alignée sur le domaine). */
export const PageSitemapSchema = z
  .object({
    include: z.boolean(),
    changefreq: SitemapChangeFreqSchema.nullable(),
    /** Priorité ∈ [0,1]. */
    priority: z
      .number()
      .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .nullable(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Schéma Page                                 */
/* -------------------------------------------------------------------------- */

/** Schéma complet Page (forme API/infra). */
export const PageSchema = z
  .object({
    /** Id technique unique (uuid). */
    id: PageIdSchema,

    parentId: PageParentIdSchema,

    /** Slug métier unique (kebab-case, non réservé). */
    slug: SlugSchema,

    /** Nom affiché de la page côté studio/admin. */
    name: PageNameSchema,

    /** Titre SEO. */
    seoTitle: PageSeoTitleSchema,

    /** Description SEO. */
    seoDescription: PageSeoDescriptionSchema,

    /** Blocs de contenu de la page. */
    blocks: z.array(BlockSchema),

    /** Métadonnées temporelles (timestamps ISO 8601). */
    meta: z
      .object({
        createdAt: IsoDateStringSchema,
        updatedAt: IsoDateStringSchema,
      })
      .strict(),

    /** Configuration sitemap. */
    sitemap: PageSitemapSchema.nullable(),

    paginationEnabled: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                       Schéma pour le rendu (preview/public)                */
/* -------------------------------------------------------------------------- */

export const PageRenderSchema = z
  .object({
    name: PageNameSchema,
    seoTitle: PageSeoTitleSchema,
    seoDescription: PageSeoDescriptionSchema,
    blocks: z.array(BlockSchema),
    paginationEnabled: z.boolean(),
  })
  .strict();

export type PageShape = z.infer<typeof PageSchema>;
export type PageSitemapShape = z.infer<typeof PageSitemapSchema>;
export type SitemapChangeFreqShape = z.infer<typeof SitemapChangeFreqSchema>;
export type PageRenderShape = z.infer<typeof PageRenderSchema>;
export type PageIdShape = z.infer<typeof PageIdSchema>;
export type PageIdParamShape = z.infer<typeof PageIdParamSchema>;
export type PageParentIdShape = z.infer<typeof PageParentIdSchema>;
export type PageParentIdParamShape = z.infer<typeof PageParentIdParamSchema>;
