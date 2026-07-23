/**
 * @file packages/validation/src/pages/blocks/cells/details/form.ts
 * @layer validation/pages/blocks/cells/details
 * @description
 * Defines Zod schemas for form cell data.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ButtonPresentationSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const FormFieldTypeSchema = z.enum(
  ["text", "email", "textarea", "select"],
  {
    message: ERROR_CODES.CELL_FORM_FIELD_TYPE_INVALID,
  },
);

const FormTextFieldTypeSchema = z.enum(["text", "email", "textarea"]);

export const FormSelectOptionSchema = z
  .object({
    label: z
      .string({
        message: ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTION_LABEL_REQUIRED,
      })
      .trim()
      .min(1, ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTION_LABEL_REQUIRED),

    value: z
      .string({
        message: ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTION_VALUE_REQUIRED,
      })
      .trim()
      .min(1, ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTION_VALUE_REQUIRED),
  })
  .strict();

export const FormButtonVariantSchema = z.enum(
  ["default", "secondary", "outline", "ghost"],
  {
    message: ERROR_CODES.CELL_FORM_VARIANT_BUTTON_INVALID,
  },
);

export const FormSubmitButtonSchema = ButtonPresentationSchema.extend({
  label: z.string().trim().min(1, ERROR_CODES.CELL_FORM_SUBMIT_LABEL_REQUIRED),
  variant: FormButtonVariantSchema,
}).strict();

const FormFieldBaseShape = {
  id: CellItemIdSchema,

  name: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_NAME_REQUIRED),

  label: z.string().trim().min(1, ERROR_CODES.CELL_FORM_FIELD_LABEL_REQUIRED),

  placeholder: z
    .string({
      message: ERROR_CODES.CELL_FORM_FIELD_PLACEHOLDER_INVALID,
    })
    .trim()
    .nullable(),

  required: z.boolean({
    message: ERROR_CODES.CELL_FORM_FIELD_REQUIRED_INVALID,
  }),
};

export const FormTextFieldSchema = z
  .object({
    ...FormFieldBaseShape,
    type: FormTextFieldTypeSchema,
  })
  .strict();

export const FormSelectFieldSchema = z
  .object({
    ...FormFieldBaseShape,
    type: z.literal("select"),
    options: z
      .array(FormSelectOptionSchema, {
        message: ERROR_CODES.CELL_FORM_FIELD_OPTIONS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTIONS_MIN_1),
  })
  .strict()
  .superRefine((field, ctx) => {
    const seenValues = new Set<string>();

    for (let index = 0; index < field.options.length; index++) {
      const option = field.options[index];

      if (seenValues.has(option.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options", index, "value"],
          message: ERROR_CODES.CELL_FORM_FIELD_SELECT_OPTION_VALUE_DUPLICATE,
        });
        continue;
      }

      seenValues.add(option.value);
    }
  });

export const FormFieldSchema = z.discriminatedUnion(
  "type",
  [FormTextFieldSchema, FormSelectFieldSchema],
  {
    error: ERROR_CODES.CELL_FORM_FIELD_TYPE_INVALID,
  },
);

export const FormCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("form"),
    cssClassName: CellCssClassNameSchema,

    to: z.string().trim().min(1, ERROR_CODES.CELL_FORM_TO_REQUIRED),

    submitButton: FormSubmitButtonSchema,

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
