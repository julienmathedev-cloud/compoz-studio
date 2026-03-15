/**
 * @file packages/validation/src/pages/blocks/cells/details/steps.ts
 * @layer schemas
 * @description
 * Schémas Zod de StepsCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellItemIdSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const StepsVariantSchema = z.enum(["vertical"], {
  message: ERROR_CODES.CELL_INVALID,
});

export const StepItemSchema = z
  .object({
    id: CellItemIdSchema,
    title: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    description: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();

export const StepsCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("steps"),
    variant: StepsVariantSchema.optional(),
    items: z.array(StepItemSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
