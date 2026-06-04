/**
 * @file packages/validation/src/pages/blocks/cells/details/form.ts
 * @layer schemas
 * @description
 * Schéma Zod de FormCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const FormFieldTypeSchema = z.enum(["text", "email", "textarea"], {
  message: ERROR_CODES.CELL_FORM_FIELD_TYPE_INVALID,
});

export const FormButtonVariantSchema = z.enum(
  ["default", "secondary", "outline", "ghost"],
  {
    message: ERROR_CODES.CELL_FORM_VARIANT_BUTTON_INVALID,
  },
);

export const FormFieldSchema = z
  .object({
    id: CellItemIdSchema,

    name: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_NAME_REQUIRED),

    label: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_LABEL_REQUIRED),

    type: FormFieldTypeSchema,

    placeholder: z
      .string({
        message: ERROR_CODES.CELL_FORM_FIELD_PLACEHOLDER_INVALID,
      })
      .trim()
      .nullable(),

    required: z.boolean({
      message: ERROR_CODES.CELL_FORM_FIELD_REQUIRED_INVALID,
    }),
  })
  .strict();

export const FormCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("form"),
    cssClassName: CellCssClassNameSchema,

    to: z.string().trim().min(1, ERROR_CODES.CELL_FORM_TO_REQUIRED),

    submitLabel: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_FORM_SUBMIT_LABEL_REQUIRED),

    variantButton: FormButtonVariantSchema,

    successMessage: z
      .string({
        message: ERROR_CODES.CELL_FORM_SUCCESS_MESSAGE_INVALID,
      })
      .trim()
      .nullable(),

    errorMessage: z
      .string({
        message: ERROR_CODES.CELL_FORM_ERROR_MESSAGE_INVALID,
      })
      .trim()
      .nullable(),

    fields: z
      .array(FormFieldSchema, {
        message: ERROR_CODES.CELL_FORM_FIELDS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_FORM_FIELDS_MIN_1),
  })
  .strict();
