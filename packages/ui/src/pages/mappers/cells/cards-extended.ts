/**
 * @file packages/ui/src/pages/mappers/cells/cards-extended.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `cardsExtended`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CardsExtendedCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCardsExtendedCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "cardsExtended" }>,
): CardsExtendedCellFormValues {
  return {
    id: cell.id,
    kind: "cardsExtended",
    columns: cell.columns,
    align: cell.align,
    items: cell.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      bullets: item.bullets ? [...item.bullets] : [],
      footer: item.footer,
      icon: item.icon,
    })),
  };
}
