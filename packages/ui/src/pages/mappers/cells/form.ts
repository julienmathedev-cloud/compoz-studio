/**
 * @file packages/ui/src/pages/mappers/cells/form.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `form`.
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
    submitLabel: cell.submitLabel,
    successMessage: cell.successMessage,
    errorMessage: cell.errorMessage,
    fields: cell.fields.map((field) => ({
      id: field.id,
      name: field.name,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
    })),
  };
}
