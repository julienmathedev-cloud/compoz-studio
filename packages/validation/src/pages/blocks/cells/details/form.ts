/**
 * @file packages/validation/src/pages/blocks/cells/details/form.ts
 * @layer schemas
 * @description
 * Schéma Zod de FormCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const FormFieldTypeSchema = z.enum(["text", "email", "textarea"], {
  message: ERROR_CODES.CELL_INVALID,
});

export const FormFieldSchema = z
  .object({
    id: CellItemIdSchema,
    name: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    label: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    type: FormFieldTypeSchema,
    placeholder: z.string().trim().optional(),
    required: z.boolean().optional(),
  })
  .strict();

export const FormCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("form"),
    to: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    submitLabel: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    successMessage: z.string().trim().optional(),
    errorMessage: z.string().trim().optional(),
    fields: z.array(FormFieldSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
