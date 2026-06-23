/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/card-collection.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for CardCollectionCell.
 *
 * @remarks
 * The card collection adapter owns cell-level concerns such as `cardKind`,
 * `columns`, `align`, `reveal`, and `cssClassName`.
 *
 * Reusable item shapes are delegated to item adapters.
 */

import type { CardCollectionCell } from "@compoz/core/domain/pages/entities/cell";
import { adaptCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/card-item";
import { adaptExtendedCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/extended-card-item";
import { adaptStructuredCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/structured-card-item";
import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";
import type {
  CardCollectionCellIntentDTO,
  CardItemIntentDTO,
  ExtendedCardItemIntentDTO,
  StructuredCardItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptCardCollectionCell(
  dto: CardCollectionCellIntentDTO,
): CardCollectionCell {
  const cardKind = dto.cardKind;

  const items =
    cardKind === "card"
      ? (dto.items as CardItemIntentDTO[]).map(adaptCardItem)
      : cardKind === "extendedCard"
        ? (dto.items as ExtendedCardItemIntentDTO[]).map(adaptExtendedCardItem)
        : (dto.items as StructuredCardItemIntentDTO[]).map(
            adaptStructuredCardItem,
          );

  return {
    id: trimOrKeep(dto.id),
    kind: "cardCollection",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    cardKind,
    columns: dto.columns,
    align: dto.align,
    reveal: dto.reveal,
    items,
  };
}
