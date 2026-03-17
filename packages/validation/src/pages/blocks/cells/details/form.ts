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
  message: ERROR_CODES.CELL_FORM_FIELD_TYPE_INVALID,
});

export const FormFieldSchema = z
  .object({
    id: CellItemIdSchema,

    name: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_NAME_REQUIRED),

    label: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_LABEL_REQUIRED),

    type: FormFieldTypeSchema,

    placeholder: z.string().trim().optional(),

    required: z
      .boolean({
        message: ERROR_CODES.CELL_FORM_FIELD_REQUIRED_INVALID,
      })
      .optional(),
  })
  .strict();

export const FormCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("form"),

    to: z.string().trim().min(1, ERROR_CODES.CELL_FORM_TO_REQUIRED),

    submitLabel: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_FORM_SUBMIT_LABEL_REQUIRED),

    successMessage: z.string().trim().optional(),

    errorMessage: z.string().trim().optional(),

    fields: z
      .array(FormFieldSchema, {
        message: ERROR_CODES.CELL_FORM_FIELDS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_FORM_FIELDS_MIN_1),
  })
  .strict();
