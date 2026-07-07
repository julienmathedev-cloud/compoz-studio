/**
 * @file packages/validation/src/pages/blocks/cells/details/carousel.ts
 * @layer validation/pages/blocks/cells/details
 *
 * @description
 * Defines Zod schemas for carousel cell data.
 *
 * @remarks
 * Item validation depends on `itemKind`, so consistency is enforced in `superRefine`.
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
  ["image", "card", "extendedCard", "structuredCard"],
  {
    message: ERROR_CODES.CELL_CAROUSEL_ITEM_KIND_INVALID,
  },
);

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
    const itemKind = cell.itemKind;

    const schemaMap = {
      image: ImageEditorSchema,
      card: CardItemSchema,
      extendedCard: ExtendedCardItemSchema,
      structuredCard: StructuredCardItemSchema,
    } as const;

    const schema = schemaMap[itemKind];

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
