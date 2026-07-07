/**
 * @file packages/validation/src/pages/blocks/items/structured-card-item.ts
 * @layer schemas
 *
 * @description
 * Zod schemas for reusable structured card items.
 *
 * @remarks
 * Structured card items carry content only. Layout concerns such as columns,
 * alignment, or reveal behavior are handled by the parent cell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ButtonItemSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import { CellItemIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";
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
 * Empty image and button values must be normalized upstream before validation.
 */
const StructuredCardImageSchema = ImageEditorSchema.nullable();
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
