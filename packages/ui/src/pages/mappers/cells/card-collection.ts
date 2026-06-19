/**
 * @file packages/ui/src/pages/mappers/cells/card-collection.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Shared runtime mapper for CardCollectionCell.
 *
 * @remarks
 * The card collection mapper owns cell-level concerns such as `cardKind`,
 * `columns`, `align`, `reveal`, and `cssClassName`.
 *
 * Reusable item shapes are delegated to item mappers.
 */

import type {
  CardCollectionCellDTO,
  CardItemDTO,
  ExtendedCardItemDTO,
  StructuredCardItemDTO,
} from "@compoz/core/domain/pages/dto";
import { normalizeCardCollectionCardKind } from "@compoz/core/domain/pages/entities/cell";
import { toCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/card-item";
import { toExtendedCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/extended-card-item";
import { toStructuredCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/structured-card-item";
import type { CardCollectionCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCardCollectionCellShapeFromDTO(
  cell: CardCollectionCellDTO,
): CardCollectionCellFormValues {
  const cardKind = normalizeCardCollectionCardKind(cell.cardKind);

  const items =
    cardKind === "card"
      ? toCardItemsShapeFromDTO(cell.items as CardItemDTO[])
      : cardKind === "extendedCard"
        ? toExtendedCardItemsShapeFromDTO(cell.items as ExtendedCardItemDTO[])
        : toStructuredCardItemsShapeFromDTO(
            cell.items as StructuredCardItemDTO[],
          );

  return {
    id: cell.id,
    kind: "cardCollection",
    cssClassName: cell.cssClassName,
    cardKind,
    columns: cell.columns,
    align: cell.align,
    reveal: cell.reveal,
    items,
  };
}
