/**
 * @file packages/validation/src/pages/blocks/cells/details/carousel.ts
 * @layer schemas
 *
 * @description
 * Zod schema for CarouselCell.
 *
 * @remarks
 * A carousel is a layout cell responsible for rendering a homogeneous list
 * of supported items as slides.
 *
 * The item schemas are defined separately because they can be reused by
 * other higher-level cells such as `cardCollection`.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";
import { CardItemSchema } from "@compoz/validation/pages/blocks/items/card-item";
import { ExtendedCardItemSchema } from "@compoz/validation/pages/blocks/items/extended-card-item";
import { StructuredCardItemSchema } from "@compoz/validation/pages/blocks/items/structured-card-item";

export const CarouselVariantSchema = z.enum(["carousel", "slider"], {
  message: ERROR_CODES.CELL_CAROUSEL_VARIANT_INVALID,
});

export const CarouselItemKindSchema = z.enum(
  ["image", "card", "cardsExtended", "structuredCard"],
  {
    message: ERROR_CODES.CELL_CAROUSEL_ITEM_KIND_INVALID,
  },
);

/**
 * Generic schema for a carousel item.
 *
 * @remarks
 * - Represents the union of all items allowed in a carousel cell.
 * - Does not guarantee consistency with `itemKind` by itself.
 * - This consistency is validated in `CarouselCellSchema.superRefine`.
 */
export const CarouselItemSchema = z.union([
  ImageEditorSchema,
  CardItemSchema,
  ExtendedCardItemSchema,
  StructuredCardItemSchema,
]);

export const CarouselCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("carousel"),
    cssClassName: CellCssClassNameSchema,

    variant: CarouselVariantSchema,

    showDots: z.boolean({
      message: ERROR_CODES.CELL_CAROUSEL_SHOW_DOTS_INVALID,
    }),

    showArrows: z.boolean({
      message: ERROR_CODES.CELL_CAROUSEL_SHOW_ARROWS_INVALID,
    }),

    itemKind: CarouselItemKindSchema,

    items: z
      .array(z.unknown(), {
        message: ERROR_CODES.CELL_CAROUSEL_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_CAROUSEL_ITEMS_MIN_1),
  })
  .strict()
  .superRefine((cell, ctx) => {
    const schemaMap = {
      image: ImageEditorSchema,
      card: CardItemSchema,
      cardsExtended: ExtendedCardItemSchema,
      structuredCard: StructuredCardItemSchema,
    } as const;

    const schema = schemaMap[cell.itemKind];

    for (let i = 0; i < cell.items.length; i++) {
      const result = schema.safeParse(cell.items[i]);

      if (result.success) continue;

      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["items", i, ...issue.path],
        });
      }
    }
  });
