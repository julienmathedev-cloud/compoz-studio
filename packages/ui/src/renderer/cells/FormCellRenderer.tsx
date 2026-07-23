/**
 * @file packages/ui/src/renderer/cells/FormCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated contact form cell.
 *
 * @remarks
 * Returns nothing when required form content is missing; valid fields are normalized before rendering through `SiteContactForm`.
 */

import { normalizeString } from "@compoz/ui/lib/normalize";
import { SiteContactForm } from "@compoz/ui/site/components/molecules/SiteContactForm";
import type { SiteFormUi } from "@compoz/ui/site/site-ui.types";
import type {
  FormCellShape,
  FormFieldShape,
} from "@compoz/validation/pages/blocks/cells/cell";

export type FormCellRendererProps = Readonly<{
  cell?: FormCellShape | null;
  ui: SiteFormUi;
}>;

type PublicButtonIconPosition = "before" | "after";

function normalizePublicButtonIconPosition(
  iconPosition: string | null | undefined,
): PublicButtonIconPosition {
  return iconPosition === "after" ? "after" : "before";
}

export function FormCellRenderer({ cell, ui }: FormCellRendererProps) {
  if (!cell) return null;

  const submitButton = cell.submitButton;
  const submitLabel = normalizeString(submitButton.label, "");

  if (!submitLabel) return null;

  const toEmail = normalizeString(cell.to);
  if (!toEmail) return null;

  const fields = normalizeFields(cell.fields);
  if (fields.length < 1) return null;

  return (
    <SiteContactForm
      fields={fields}
      submitButton={{
        label: submitLabel,
        variant: submitButton.variant,
        icon: submitButton.icon,
        iconPosition: normalizePublicButtonIconPosition(
          submitButton.iconPosition,
        ),
      }}
      toEmail={toEmail}
      successMessage={cell.successMessage}
      errorMessage={cell.errorMessage}
      ui={ui}
    />
  );
}

FormCellRenderer.displayName = "FormCellRenderer";

function normalizeFields(
  fields: readonly FormFieldShape[] | null,
): FormFieldShape[] {
  if (!fields?.length) return [];

  return fields.filter(isRenderableFormField).map((field) => {
    const base = {
      id: normalizeString(field.id, ""),
      name: normalizeString(field.name, ""),
      label: normalizeString(field.label, ""),
      placeholder: normalizeNullableString(field.placeholder),
      required: field.required === true,
    };

    if (field.type !== "select") {
      return {
        ...base,
        type: field.type,
      };
    }

    return {
      ...base,
      type: "select" as const,
      options: normalizeFormSelectOptions(field.options),
    };
  });
}

function isRenderableFormField(field: FormFieldShape): boolean {
  const id = normalizeString(field.id, "");
  const name = normalizeString(field.name, "");
  const label = normalizeString(field.label, "");

  if (!id || !name || !label) return false;

  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "textarea"
  ) {
    return true;
  }

  if (field.type !== "select") {
    return false;
  }

  const options = normalizeFormSelectOptions(field.options);

  if (options.length < 1 || options.length !== field.options.length) {
    return false;
  }

  return new Set(options.map((option) => option.value)).size === options.length;
}

function normalizeFormSelectOptions(
  options: Extract<FormFieldShape, { type: "select" }>["options"],
): Extract<FormFieldShape, { type: "select" }>["options"] {

  return options
    .map((option) => ({
      label: normalizeString(option.label, ""),
      value: normalizeString(option.value, ""),
    }))
    .filter((option) => option.label.length > 0 && option.value.length > 0);
}

function normalizeNullableString(value: string | null): string | null {
  const normalized = normalizeString(value ?? "", "");
  return normalized || null;
}
