/**
 * @file packages/validation/src/pages/page.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the boundary shape of pages.
 *
 * @remarks
 * These schemas validate API and infrastructure payload shapes only. Business
 * invariants and global consistency rules are handled by the domain layer.
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

export const SlugSchema = z
  .string()
  .trim()
  .min(SLUG.MIN, ERROR_CODES.PAGE_SLUG_REQUIRED)
  .regex(SLUG_FINAL_RE, ERROR_CODES.PAGE_SLUG_INVALID_FORMAT)
  .refine((s) => !isReservedSlug(s), ERROR_CODES.PAGE_SLUG_RESERVED);

export const PageNameSchema = z
  .string()
  .trim()
  .min(PAGE_NAME.MIN, ERROR_CODES.PAGE_TITLE_TOO_SHORT)
  .max(PAGE_NAME.MAX, ERROR_CODES.PAGE_TITLE_TOO_LONG);

export const PageSeoTitleSchema = z
  .string()
  .trim()
  .max(PAGE_SEO_TITLE.MAX, ERROR_CODES.PAGE_TITLE_TOO_LONG)
  .nullable();

export const PageSeoDescriptionSchema = z
  .string()
  .trim()
  .max(PAGE_SEO_DESCRIPTION.MAX, ERROR_CODES.SEO_DESCRIPTION_TOO_LONG)
  .nullable();

/**
 * Page IDs intentionally remain non-empty strings so storage implementations
 * can evolve without changing the validation boundary.
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

export const SitemapChangeFreqSchema = z.enum([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const);

export const PageSitemapSchema = z
  .object({
    include: z.boolean(),
    changefreq: SitemapChangeFreqSchema.nullable(),
    priority: z
      .number()
      .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
      .nullable(),
  })
  .strict();

export const PageSchema = z
  .object({
    id: PageIdSchema,
    parentId: PageParentIdSchema,
    slug: SlugSchema,
    name: PageNameSchema,
    seoTitle: PageSeoTitleSchema,
    seoDescription: PageSeoDescriptionSchema,
    blocks: z.array(BlockSchema),
    meta: z
      .object({
        createdAt: IsoDateStringSchema,
        updatedAt: IsoDateStringSchema,
      })
      .strict(),
    sitemap: PageSitemapSchema.nullable(),
    paginationEnabled: z.boolean(),
  })
  .strict();

/**
 * Render payload intentionally omits routing and metadata fields not needed by
 * preview or public rendering.
 */
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
