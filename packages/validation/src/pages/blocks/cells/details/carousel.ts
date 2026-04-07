/**
 * @file packages/validation/src/pages/blocks/cells/details/carousel.ts
 * @layer schemas
 * @description
 * Schéma Zod de CarouselCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CardItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards";
import { CardsExtendedItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";
import { StructuredCardItemSchema } from "@compoz/validation/pages/blocks/cells/details/structured-card";

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
 * Schéma générique d’un item de carousel.
 *
 * @remarks
 * - Représente l’union de tous les items autorisés dans une carousel cell.
 * - Ne suffit pas à lui seul à valider la cohérence avec `itemKind`.
 * - Cette cohérence reste validée dans `CarouselCellSchema.superRefine`.
 */
export const CarouselItemSchema = z.union([
  ImageEditorSchema,
  CardItemSchema,
  CardsExtendedItemSchema,
  StructuredCardItemSchema,
]);

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
      cardsExtended: CardsExtendedItemSchema,
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
