/**
 * @file packages/ui/src/pages/mappers/cells/spacer.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `spacer`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { SpacerCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toSpacerCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "spacer" }>,
): SpacerCellFormValues {
  return {
    id: cell.id,
    kind: "spacer",
    cssClassName: cell.cssClassName,
    size: cell.size,
    visibility: cell.visibility,
  };
}
