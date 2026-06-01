/**
 * @file packages/validation/src/pages/blocks/cells/details/cards-extended.ts
 * @layer schemas
 * @description
 * Schémas Zod de CardsExtendedCell.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const CardsExtendedColumnsSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)],
  {
    message: ERROR_CODES.CELL_CARDS_EXTENDED_COLUMNS_INVALID,
  },
);

export const CardsExtendedAlignSchema = z.enum(["left", "center"], {
  message: ERROR_CODES.CELL_CARDS_EXTENDED_ALIGN_INVALID,
});

export const CardsExtendedBulletSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_BULLET_INVALID);

export const CardsExtendedItemSchema = z
  .object({
    id: CellItemIdSchema,

    title: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_TITLE_REQUIRED),

    description: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_DESCRIPTION_REQUIRED),

    bullets: z
      .array(CardsExtendedBulletSchema, {
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_BULLETS_INVALID,
      })
      .nullable(),

    footer: z
      .string({
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_FOOTER_INVALID,
      })
      .trim()
      .nullable(),

    icon: z
      .enum(CONTENT_ICON_KINDS, {
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_ICON_INVALID,
      })
      .nullable(),
  })
  .strict();

export const CardsExtendedCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("cardsExtended"),
    cssClassName: CellCssClassNameSchema,
    columns: CardsExtendedColumnsSchema,
    align: CardsExtendedAlignSchema,
    reveal: z.boolean({
      message: ERROR_CODES.CELL_CARDS_EXTENDED_REVEAL_INVALID,
    }),
    items: z
      .array(CardsExtendedItemSchema, {
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEMS_MIN_1),
  })
  .strict();
