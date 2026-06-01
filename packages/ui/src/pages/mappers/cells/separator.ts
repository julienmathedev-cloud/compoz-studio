/**
 * @file packages/ui/src/pages/mappers/cells/separator.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `separator`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { SeparatorCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toSeparatorCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "separator" }>,
): SeparatorCellFormValues {
  return {
    id: cell.id,
    kind: "separator",
    cssClassName: cell.cssClassName,
    align: cell.align,
    size: cell.size,
  };
}
