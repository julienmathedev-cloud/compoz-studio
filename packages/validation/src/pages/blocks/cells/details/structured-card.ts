/**
 * @file packages/validation/src/pages/blocks/cells/details/structured-card.ts
 * @layer schemas
 * @description
 * Schémas Zod de la cellule StructuredCard.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ButtonItemSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";

export const StructuredCardSectionSchema = z
  .object({
    id: CellItemIdSchema,

    label: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_STRUCTURED_CARD_SECTION_LABEL_REQUIRED),

    content: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_STRUCTURED_CARD_SECTION_CONTENT_REQUIRED),
  })
  .strict();

/**
 * Image d’une structured card.
 *
 * @remarks
 * - Schéma strictement typé.
 * - La normalisation "image vide => null" doit être faite en amont
 *   (mapper / normalizer UI), pas ici.
 */
const StructuredCardImageSchema = ImageEditorSchema.nullable();

/**
 * Bouton d’une structured card.
 *
 * @remarks
 * - Schéma strictement typé.
 * - La normalisation "bouton vide => null" doit être faite en amont
 *   (mapper / normalizer UI), pas ici.
 */
const StructuredCardButtonSchema = ButtonItemSchema.nullable();

export const StructuredCardItemSchema = z
  .object({
    id: CellItemIdSchema,

    image: StructuredCardImageSchema,

    title: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_STRUCTURED_CARD_ITEM_TITLE_REQUIRED),

    meta: z
      .string({
        message: ERROR_CODES.CELL_STRUCTURED_CARD_ITEM_META_INVALID,
      })
      .trim()
      .nullable(),

    sections: z
      .array(StructuredCardSectionSchema, {
        message: ERROR_CODES.CELL_STRUCTURED_CARD_ITEM_SECTIONS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_STRUCTURED_CARD_ITEM_SECTIONS_MIN_1),

    button: StructuredCardButtonSchema,
  })
  .strict();

export const StructuredCardColumnsSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)],
  {
    message: ERROR_CODES.CELL_STRUCTURED_CARD_COLUMNS_INVALID,
  },
);

export const StructuredCardCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("structuredCard"),
    cssClassName: CellCssClassNameSchema,

    columns: StructuredCardColumnsSchema,

    reveal: z.boolean({
      message: ERROR_CODES.CELL_STRUCTURED_CARD_REVEAL_INVALID,
    }),

    items: z
      .array(StructuredCardItemSchema, {
        message: ERROR_CODES.CELL_STRUCTURED_CARD_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_STRUCTURED_CARD_ITEMS_MIN_1),
  })
  .strict();
