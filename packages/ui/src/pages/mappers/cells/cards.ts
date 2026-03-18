/**
 * @file packages/ui/src/pages/mappers/cells/cards.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `cards`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CardsCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCardsCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "cards" }>,
): CardsCellFormValues {
  return {
    id: cell.id,
    kind: "cards",
    columns: cell.columns,
    align: cell.align,
    reveal: cell.reveal,
    items: cell.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon,
    })),
  };
}
