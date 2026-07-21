/**
 * @file packages/validation/src/pages/blocks/items/card-item.ts
 * @layer schemas
 *
 * @description
 * Zod schema for reusable card items.
 *
 * @remarks
 * Card items carry content only. Layout concerns such as columns, alignment,
 * or reveal behavior are handled by the parent cell.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ButtonItemSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import { CellItemIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const CardItemSchema = z
  .object({
    id: CellItemIdSchema,
    eyebrow: z.string().trim().nullable(),
    title: z.string().trim().min(1, ERROR_CODES.CELL_CARD_ITEM_TITLE_REQUIRED),
    description: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARD_ITEM_DESCRIPTION_REQUIRED),
    icon: z
      .enum(CONTENT_ICON_KINDS, {
        message: ERROR_CODES.CELL_CARD_ITEM_ICON_INVALID,
      })
      .nullable(),
    button: ButtonItemSchema.nullable(),
  })
  .strict();
