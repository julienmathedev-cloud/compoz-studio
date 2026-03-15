/**
 * @file packages/validation/src/pages/blocks/cells/details/buttons.ts
 * @layer schemas
 * @description
 * Schémas Zod de ButtonsCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellItemIdSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const ButtonItemVariantSchema = z.enum(
  ["default", "secondary", "outline", "ghost"],
  { message: ERROR_CODES.CELL_INVALID },
);

export const ButtonsAlignSchema = z.enum(["left", "center", "right"], {
  message: ERROR_CODES.CELL_INVALID,
});

export const ButtonsGapSchema = z.enum(["sm", "md", "lg"], {
  message: ERROR_CODES.CELL_INVALID,
});

export const ButtonItemSchema = z
  .object({
    id: CellItemIdSchema,
    label: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
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
    items: z.array(ButtonItemSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
