/**
 * @file packages/core/src/domain/pages/entities/cells/form.ts
 * @layer core/domain/pages
 * @description Contact form cell domain entity.
 */

import type {
  ButtonItemVariant,
  ButtonPresentation,
} from "@compoz/core/domain/pages/entities/cells/buttons";

export type FormFieldType = "text" | "email" | "textarea" | "select";

export type FormSelectOption = Readonly<{
  label: string;
  value: string;
}>;

export type FormButtonVariant = ButtonItemVariant;
export type FormSubmitButton = ButtonPresentation;

export type FormFieldBase = {
  id: string;
  name: string;
  label: string;
  placeholder: string | null;
  required: boolean;
};

export type FormTextField = FormFieldBase & {
  type: "text" | "email" | "textarea";
  options?: never;
};

export type FormSelectField = FormFieldBase & {
  type: "select";
  options: ReadonlyArray<FormSelectOption>;
};

export type FormField = FormTextField | FormSelectField;

export type FormCell = {
  id: string;
  kind: "form";
  cssClassName?: string;

  to: string;

  submitButton: FormSubmitButton;

  successMessage: string | null;

  errorMessage: string | null;

  fields: ReadonlyArray<FormField>;
};
