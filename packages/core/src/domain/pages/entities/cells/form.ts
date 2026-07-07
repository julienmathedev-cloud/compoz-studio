/**
 * @file packages/core/src/domain/pages/entities/cells/form.ts
 * @layer core/domain/pages
 * @description Contact form cell domain entity.
 */

import type {
  ButtonItemVariant,
  ButtonPresentation,
} from "@compoz/core/domain/pages/entities/cells/buttons";

export type FormFieldType = "text" | "email" | "textarea";

export type FormButtonVariant = ButtonItemVariant;
export type FormSubmitButton = ButtonPresentation;

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder: string | null;
  required: boolean;
};

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
