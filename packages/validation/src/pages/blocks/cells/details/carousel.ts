/**
 * @file packages/validation/src/pages/blocks/cells/details/carousel.ts
 * @layer schemas
 * @description
 * Schéma Zod de CarouselCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

import { CardItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards";
import { CardsExtendedItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image";
import { StructuredCardItemSchema } from "@compoz/validation/pages/blocks/cells/details/structured-card";

/* ------------------------------------------------------------------ */
/* Variant                                                            */
/* ------------------------------------------------------------------ */

export const CarouselVariantSchema = z.enum(["carousel", "slider"], {
  message: ERROR_CODES.CELL_CAROUSEL_VARIANT_INVALID,
});

/* ------------------------------------------------------------------ */
/* Item kind                                                          */
/* ------------------------------------------------------------------ */

export const CarouselItemKindSchema = z.enum(
  ["image", "card", "cardsExtended", "structuredCard"],
  {
    message: ERROR_CODES.CELL_CAROUSEL_ITEM_KIND_INVALID,
  },
);

/* ------------------------------------------------------------------ */
/* Items                                                              */
/* ------------------------------------------------------------------ */

export const CarouselItemSchema = z.union([
  ImageEditorSchema,
  CardItemSchema,
  CardsExtendedItemSchema,
  StructuredCardItemSchema,
]);

/* ------------------------------------------------------------------ */
/* Cell                                                               */
/* ------------------------------------------------------------------ */

export const CarouselCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("carousel"),

    variant: CarouselVariantSchema,

    showDots: z.boolean({
      message: ERROR_CODES.CELL_CAROUSEL_SHOW_DOTS_INVALID,
    }),

    showArrows: z.boolean({
      message: ERROR_CODES.CELL_CAROUSEL_SHOW_ARROWS_INVALID,
    }),

    itemKind: CarouselItemKindSchema,

    items: z
      .array(CarouselItemSchema, {
        message: ERROR_CODES.CELL_CAROUSEL_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_CAROUSEL_ITEMS_MIN_1),
  })
  .strict()
  .superRefine((cell, ctx) => {
    const schemaMap = {
      image: ImageEditorSchema,
      card: CardItemSchema,
      cardsExtended: CardsExtendedItemSchema,
      structuredCard: StructuredCardItemSchema,
    } as const;

    const schema = schemaMap[cell.itemKind];

    for (let i = 0; i < cell.items.length; i++) {
      const result = schema.safeParse(cell.items[i]);

      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ERROR_CODES.CELL_CAROUSEL_ITEM_KIND_INVALID,
          path: ["items", i],
        });
      }
    }
  });
