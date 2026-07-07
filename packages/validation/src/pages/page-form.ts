/**
 * @file packages/validation/src/pages/page-form.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the UI form shape used to create or edit pages.
 *
 * @remarks
 * This schema is RHF-friendly and can temporarily accept draft values before
 * they are normalized or rejected by the final page boundary schema.
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
 * Draft-friendly slug schema used while the user is editing the form.
 *
 * @remarks
 * Empty values are allowed during input. Non-empty values must match the final
 * page slug boundary, except `/`, which represents the home page in the UI.
 */
const PageSlugFormSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    const v = val.trim();
    if (v.length === 0) return;

    if (v === "/") return;

    const parsed = SlugSchema.safeParse(v);
    if (!parsed.success) {
      const firstMessage =
        parsed.error.issues[0]?.message ?? ERROR_CODES.PAGE_SLUG_INVALID_FORMAT;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: firstMessage,
      });
    }
  });

/**
 * Sitemap form schema.
 *
 * @remarks
 * Nullable values let the UI express an explicit reset before final page
 * normalization is applied.
 */
const PageSitemapFormSchema = z
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

export const PageFormSchema = z
  .object({
    name: PageNameSchema,
    seoTitle: PageSeoTitleSchema,
    seoDescription: PageSeoDescriptionSchema,
    parentId: PageIdSchema.nullable(),
    slug: PageSlugFormSchema,
    sitemap: PageSitemapFormSchema.nullable(),
    paginationEnabled: z.boolean(),
  })
  .strict();

export type PageFormValues = z.infer<typeof PageFormSchema>;
