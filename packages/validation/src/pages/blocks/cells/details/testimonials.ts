/**

 * @file packages/validation/src/pages/blocks/cells/details/testimonials.ts

 * @layer validation/pages/blocks/cells/details

 * @description

 * Defines Zod schemas for testimonials cell data.

 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const TestimonialsDisplayModeSchema = z.enum(["static", "marquee"], {
  message: ERROR_CODES.CELL_TESTIMONIALS_DISPLAY_MODE_INVALID,
});

export const TestimonialRatingSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)],
  {
    message: ERROR_CODES.CELL_TESTIMONIAL_ITEM_RATING_INVALID,
  },
);

const OptionalTrimmedStringSchema = z.string().trim().optional();

export const TestimonialItemSchema = z
  .object({
    id: CellItemIdSchema,
    quote: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_TESTIMONIAL_ITEM_QUOTE_REQUIRED),
    authorName: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_TESTIMONIAL_ITEM_AUTHOR_NAME_REQUIRED),
    authorRole: OptionalTrimmedStringSchema,
    authorImage: OptionalTrimmedStringSchema,
    rating: TestimonialRatingSchema.optional(),
  })
  .strict();

export const TestimonialsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("testimonials"),
    cssClassName: CellCssClassNameSchema,
    title: OptionalTrimmedStringSchema,
    description: OptionalTrimmedStringSchema,
    displayMode: TestimonialsDisplayModeSchema,
    items: z
      .array(TestimonialItemSchema, {
        message: ERROR_CODES.CELL_TESTIMONIALS_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_TESTIMONIALS_ITEMS_MIN_1),
  })
  .strict();
