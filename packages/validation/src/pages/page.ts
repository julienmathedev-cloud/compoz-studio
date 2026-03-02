/**
 * @file packages/validation/src/pages/page.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière d’une page.
 * Ces schémas valident uniquement la structure des données exposées (API / infra) ;
 * les invariants métier et règles globales sont traités dans le domaine.
 */

import { PAGE_TITLE } from "@compoz/core/constants/limits/pages";
import { SLUG } from "@compoz/core/constants/limits/slug";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { isReservedSlug } from "@compoz/core/domain/slug/utils";
import { IsoDateStringSchema } from "@compoz/validation/common/date";
import {
  BlockSchema,
  LayoutSectionBlockSchema,
} from "@compoz/validation/pages/blocks/block";
import { z } from "zod";

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
 * Titre de page :
 * - trim automatique
 * - bornes min/max alignées sur `PAGE_TITLE`
 */
export const PageTitleSchema = z
  .string()
  .trim()
  .min(PAGE_TITLE.MIN, ERROR_CODES.PAGE_TITLE_TOO_SHORT)
  .max(PAGE_TITLE.MAX, ERROR_CODES.PAGE_TITLE_TOO_LONG);

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

/** Bloc sitemap (forme frontière ; defaults appliqués côté domaine). */
export const PageSitemapSchema = z
  .object({
    include: z.boolean(),
    changefreq: SitemapChangeFreqSchema.optional(),
    /** Priorité ∈ [0,1] ; validations métier complémentaires côté domaine. */
    priority: z
      .number()
      .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Schéma Page                                 */
/* -------------------------------------------------------------------------- */

/** Schéma complet Page (forme API/infra, sans `id`, sans `layout`). */
export const PageSchema = z
  .object({
    /** Id technique unique (uuid). */
    id: PageIdSchema,

    parentId: PageParentIdSchema,

    /** Slug métier unique (kebab-case, non réservé, /). */
    slug: SlugSchema,

    /** Titre affiché de la page (trim + min/max). */
    title: PageTitleSchema,

    /** Blocs de contenu de la page. */
    blocks: z.array(BlockSchema),

    /** Métadonnées temporelles (timestamps ISO 8601). */
    meta: z
      .object({
        createdAt: IsoDateStringSchema,
        updatedAt: IsoDateStringSchema,
      })
      .strict(),

    /** Configuration sitemap optionnelle. */
    sitemap: PageSitemapSchema.optional(),

    paginationEnabled: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* schema pour le rendu (preview/public)                                    */
/* -------------------------------------------------------------------------- */
export const PageRenderSchema = z
  .object({
    title: PageTitleSchema,
    blocks: z.array(LayoutSectionBlockSchema),
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
