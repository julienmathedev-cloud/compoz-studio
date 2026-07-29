/**
 * @file packages/validation/src/pages/page-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing page intent payload boundaries.
 *
 * @remarks
 * These schemas validate API and UI payload shapes only. Business rules and
 * consistency decisions are handled by the domain layer.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  PageIdSchema,
  PageNameSchema,
  PageSeoDescriptionSchema,
  PageSeoTitleSchema,
  SitemapChangeFreqSchema,
  SlugSchema,
} from "@compoz/validation/pages/page";

/**
 * Partial sitemap patch schema used by page intents.
 *
 * @remarks
 * Missing keys leave existing values unchanged, while `null` explicitly clears
 * nullable sitemap fields.
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

export const CreatePageIntentSchema = z
  .object({
    name: PageNameSchema,
    seoTitle: PageSeoTitleSchema,
    seoDescription: PageSeoDescriptionSchema,
    parentId: PageIdSchema.nullable(),

    /**
     * Slug may be omitted so the domain layer can generate or normalize it.
     * `/` represents the home page flow.
     */
    slug: z.union([SlugSchema, z.literal("/")]).optional(),

    /**
     * `null` means no explicit sitemap config was provided at creation time.
     */
    sitemap: PageSitemapIntentSchema.nullable(),

    paginationEnabled: z.boolean(),
    expectedDraftStructureRevision: z.number().int().nonnegative(),
  })
  .strict();

export type CreatePageIntentDTO = z.infer<typeof CreatePageIntentSchema>;

/**
 * Partial page update payload.
 *
 * @remarks
 * Missing keys leave values unchanged. `null` is kept only where the API needs
 * an explicit clear or root-page signal.
 */
export const UpdatePageIntentSchema = z
  .object({
    name: PageNameSchema.optional(),
    seoTitle: PageSeoTitleSchema.optional(),
    seoDescription: PageSeoDescriptionSchema.optional(),
    parentId: PageIdSchema.nullable().optional(),

    /**
     * Empty and home slugs are kept to support the existing UI flow.
     */
    slug: z.union([SlugSchema, z.literal(""), z.literal("/")]).optional(),

    sitemap: PageSitemapIntentSchema.nullable().optional(),
    paginationEnabled: z.boolean().optional(),
    expectedDraftStructureRevision: z.number().int().nonnegative().optional(),
    expectedPrimaryMenuRevision: z.number().int().nonnegative().optional(),
    expectedLegalMenuRevision: z.number().int().nonnegative().optional(),
  })
  .strict();

export type UpdatePageIntentDTO = z.infer<typeof UpdatePageIntentSchema>;

export const ReorderChildrenIntentSchema = z
  .object({
    childIds: z.array(PageIdSchema),
    expectedDraftStructureRevision: z.number().int().nonnegative(),
  })
  .strict();

export type ReorderChildrenIntentDTO = z.infer<
  typeof ReorderChildrenIntentSchema
>;

export const DeletePageIntentSchema = z
  .object({
    expectedDraftStructureRevision: z.number().int().nonnegative(),
  })
  .strict();

export type DeletePageIntentDTO = z.infer<typeof DeletePageIntentSchema>;
