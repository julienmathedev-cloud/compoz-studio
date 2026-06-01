/**
 * @file packages/ui/src/pages/mappers/cells/steps.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `steps`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { StepsCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toStepsCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "steps" }>,
): StepsCellFormValues {
  return {
    id: cell.id,
    kind: "steps",
    cssClassName: cell.cssClassName,
    variant: cell.variant,
    items: cell.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    })),
  };
}
