/**
 * @file packages/ui/src/pages/mappers/cells/form.ts
 * @layer ui/pages/mappers
 * @description Maps form cell DTOs to form values.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { FormCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toFormCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "form" }>,
): FormCellFormValues {
  return {
    id: cell.id,
    kind: "form",
    cssClassName: cell.cssClassName,
    to: cell.to,
    submitButton: {
      label: cell.submitButton.label,
      variant: cell.submitButton.variant,
      icon: cell.submitButton.icon,
      iconPosition:
        cell.submitButton.iconPosition === "after" ? "after" : "before",
    },
    successMessage: cell.successMessage,
    errorMessage: cell.errorMessage,
    fields: cell.fields.map((field) => {
      const base = {
        id: field.id,
        name: field.name,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
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
        options: field.options.map((option) => ({
          label: option.label,
          value: option.value,
        })),
      };
    }),
  };
}
