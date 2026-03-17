/**
 * @file packages/validation/src/pages/blocks/cells/details/buttons.ts
 * @layer schemas
 * @description
 * Schémas Zod de ButtonsCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const ButtonItemVariantSchema = z.enum(
  ["default", "secondary", "outline", "ghost"],
  {
    message: ERROR_CODES.CELL_BUTTON_ITEM_VARIANT_INVALID,
  },
);

export const ButtonsAlignSchema = z.enum(["left", "center", "right"], {
  message: ERROR_CODES.CELL_BUTTONS_ALIGN_INVALID,
});

export const ButtonsGapSchema = z.enum(["sm", "md", "lg"], {
  message: ERROR_CODES.CELL_BUTTONS_GAP_INVALID,
});

export const ButtonItemSchema = z
  .object({
    id: CellItemIdSchema,
    label: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_BUTTON_ITEM_LABEL_REQUIRED),
    href: z.string().trim(),
    variant: ButtonItemVariantSchema,
  })
  .strict();

export const ButtonsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("buttons"),
    align: ButtonsAlignSchema.optional(),
    gap: ButtonsGapSchema.optional(),
    items: z
      .array(ButtonItemSchema, {
        message: ERROR_CODES.CELL_BUTTONS_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_BUTTONS_ITEMS_MIN_1),
  })
  .strict();
