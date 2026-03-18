/**
 * @file packages/ui/src/pages/mappers/cells/structured-card.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `structuredCard`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { StructuredCardCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toStructuredCardCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "structuredCard" }>,
): StructuredCardCellFormValues {
  return {
    id: cell.id,
    kind: "structuredCard",
    columns: cell.columns,
    reveal: cell.reveal,
    items: cell.items.map((item) => ({
      id: item.id,
      image: item.image,
      title: item.title,
      meta: item.meta,
      sections: item.sections.map((section) => ({
        id: section.id,
        label: section.label,
        content: section.content,
      })),
    })),
  };
}
