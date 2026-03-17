/**
 * @file packages/validation/src/pages/blocks/cells/details/cards.ts
 * @layer schemas
 * @description
 * Schémas Zod de CardsCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellItemIdSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const CardsColumnsSchema = z.union(
  [z.literal(2), z.literal(3), z.literal(4)],
  {
    message: ERROR_CODES.CELL_CARDS_COLUMNS_INVALID,
  },
);

export const CardsAlignSchema = z.enum(["left", "center"], {
  message: ERROR_CODES.CELL_CARDS_ALIGN_INVALID,
});

export const CardItemSchema = z
  .object({
    id: CellItemIdSchema,
    title: z.string().trim().min(1, ERROR_CODES.CELL_CARD_ITEM_TITLE_REQUIRED),
    description: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARD_ITEM_DESCRIPTION_REQUIRED),
    icon: z
      .string({
        message: ERROR_CODES.CELL_CARD_ITEM_ICON_INVALID,
      })
      .trim()
      .optional(),
  })
  .strict();

export const CardsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("cards"),
    columns: CardsColumnsSchema,
    align: CardsAlignSchema.optional(),
    items: z
      .array(CardItemSchema, {
        message: ERROR_CODES.CELL_CARDS_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_CARDS_ITEMS_MIN_1),
  })
  .strict();
