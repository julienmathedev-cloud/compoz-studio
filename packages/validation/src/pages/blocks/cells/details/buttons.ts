/**
 * @file packages/validation/src/pages/blocks/cells/details/buttons.ts
 * @layer schemas
 * @description
 * Schémas Zod de ButtonsCell.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const ButtonItemVariantSchema = z.enum(
  ["default", "secondary", "outline", "ghost"],
  {
    message: ERROR_CODES.CELL_BUTTON_ITEM_VARIANT_INVALID,
  },
);

export const ButtonIconPositionSchema = z.enum(["before", "after"], {
  message: ERROR_CODES.CELL_BUTTON_ICON_POSITION_INVALID,
});

export const ButtonPresentationSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_BUTTON_ITEM_LABEL_REQUIRED),
    variant: ButtonItemVariantSchema,
    icon: z
      .enum(CONTENT_ICON_KINDS, {
        message: ERROR_CODES.CELL_BUTTON_ICON_INVALID,
      })
      .nullable(),
    iconPosition: ButtonIconPositionSchema,
  })
  .strict();

export const ButtonsAlignSchema = z.enum(["left", "center", "right"], {
  message: ERROR_CODES.CELL_BUTTONS_ALIGN_INVALID,
});

export const ButtonsGapSchema = z.enum(["sm", "md", "lg"], {
  message: ERROR_CODES.CELL_BUTTONS_GAP_INVALID,
});

export const ButtonItemSchema = ButtonPresentationSchema.extend({
  id: CellItemIdSchema,
  href: z.string().trim(),
}).strict();

export const ButtonsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("buttons"),
    cssClassName: CellCssClassNameSchema,
    align: ButtonsAlignSchema,
    gap: ButtonsGapSchema,
    items: z
      .array(ButtonItemSchema, {
        message: ERROR_CODES.CELL_BUTTONS_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_BUTTONS_ITEMS_MIN_1),
  })
  .strict();
