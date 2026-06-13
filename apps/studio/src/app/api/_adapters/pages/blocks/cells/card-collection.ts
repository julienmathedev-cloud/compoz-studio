/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/card-collection.ts
 * @layer studio/app/api/adapters
 * @description Adapteur API Studio pour CardCollectionCell.
 */

import type {
  CardCollectionCardColumns,
  CardCollectionCell,
  CardCollectionStackedColumns,
} from "@compoz/core/domain/pages/entities/cell";
import { adaptCardsCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards";
import { adaptCardsExtendedCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards-extended";
import { adaptStructuredCardCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/structured-card";
import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";
import type {
  CardCollectionCellIntentDTO,
  CardItemIntentDTO,
  CardsExtendedItemIntentDTO,
  StructuredCardItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptCardCollectionCell(
  dto: CardCollectionCellIntentDTO,
): CardCollectionCell {
  const items =
    dto.cardKind === "card"
      ? adaptCardsCell({
          id: dto.id,
          kind: "cards",
          columns: dto.columns as CardCollectionCardColumns,
          align: dto.align,
          reveal: dto.reveal,
          items: dto.items as CardItemIntentDTO[],
        }).items
      : dto.cardKind === "cardsExtended"
        ? adaptCardsExtendedCell({
            id: dto.id,
            kind: "cardsExtended",
            columns: dto.columns as CardCollectionStackedColumns,
            align: dto.align,
            reveal: dto.reveal,
            items: dto.items as CardsExtendedItemIntentDTO[],
          }).items
        : adaptStructuredCardCell({
            id: dto.id,
            kind: "structuredCard",
            columns: dto.columns as CardCollectionStackedColumns,
            reveal: dto.reveal,
            items: dto.items as StructuredCardItemIntentDTO[],
          }).items;

  return {
    id: trimOrKeep(dto.id),
    kind: "cardCollection",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    cardKind: dto.cardKind,
    columns: dto.columns,
    align: dto.align,
    reveal: dto.reveal,
    items,
  };
}
