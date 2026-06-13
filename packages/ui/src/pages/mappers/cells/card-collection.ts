/**
 * @file packages/ui/src/pages/mappers/cells/card-collection.ts
 * @layer ui/pages/mappers
 * @description Mapper partagé pour CardCollectionCell.
 */

import type {
  CardCollectionCellDTO,
  CardItemDTO,
  CardsExtendedItemDTO,
  StructuredCardItemDTO,
} from "@compoz/core/domain/pages/dto";
import type {
  CardCollectionCardColumns,
  CardCollectionStackedColumns,
} from "@compoz/core/domain/pages/entities/cell";
import { toCardsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards";
import { toCardsExtendedCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards-extended";
import { toStructuredCardCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/structured-card";
import type { CardCollectionCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCardCollectionCellShapeFromDTO(
  cell: CardCollectionCellDTO,
): CardCollectionCellFormValues {
  const items =
    cell.cardKind === "card"
      ? toCardsCellShapeFromDTO({
          id: cell.id,
          kind: "cards",
          columns: cell.columns as CardCollectionCardColumns,
          align: cell.align,
          reveal: cell.reveal,
          items: cell.items as CardItemDTO[],
        }).items
      : cell.cardKind === "cardsExtended"
        ? toCardsExtendedCellShapeFromDTO({
            id: cell.id,
            kind: "cardsExtended",
            columns: cell.columns as CardCollectionStackedColumns,
            align: cell.align,
            reveal: cell.reveal,
            items: cell.items as CardsExtendedItemDTO[],
          }).items
        : toStructuredCardCellShapeFromDTO({
            id: cell.id,
            kind: "structuredCard",
            columns: cell.columns as CardCollectionStackedColumns,
            reveal: cell.reveal,
            items: cell.items as StructuredCardItemDTO[],
          }).items;

  return {
    id: cell.id,
    kind: "cardCollection",
    cssClassName: cell.cssClassName,
    cardKind: cell.cardKind,
    columns: cell.columns,
    align: cell.align,
    reveal: cell.reveal,
    items,
  };
}
