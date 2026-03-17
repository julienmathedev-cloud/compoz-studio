/**
 * @file packages/validation/src/pages/blocks/cells/details/steps.ts
 * @layer schemas
 * @description
 * Schémas Zod de StepsCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const StepsVariantSchema = z.enum(["vertical"], {
  message: ERROR_CODES.CELL_STEPS_VARIANT_INVALID,
});

export const StepItemSchema = z
  .object({
    id: CellItemIdSchema,
    title: z.string().trim().min(1, ERROR_CODES.CELL_STEP_ITEM_TITLE_REQUIRED),
    description: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_STEP_ITEM_DESCRIPTION_REQUIRED),
  })
  .strict();

export const StepsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("steps"),
    variant: StepsVariantSchema.optional(),
    items: z
      .array(StepItemSchema, {
        message: ERROR_CODES.CELL_STEPS_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_STEPS_ITEMS_MIN_1),
  })
  .strict();
