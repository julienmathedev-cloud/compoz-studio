/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/cards-extended.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `CardsExtendedCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  CardsExtendedCell,
  CardsExtendedItem,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  CardsExtendedCellIntentDTO,
  CardsExtendedItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptCardsExtendedItem(
  dto: CardsExtendedItemIntentDTO,
): CardsExtendedItem {
  return {
    id: trimOrKeep(dto.id),
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),

    bullets: (dto.bullets ?? [])
      .map((bullet) => trimOrKeep(bullet))
      .filter(Boolean),

    footer: dto.footer ? trimOrKeep(dto.footer) : null,
    icon: dto.icon ? (trimOrKeep(dto.icon) as CardsExtendedItem["icon"]) : null,
  };
}

export function adaptCardsExtendedCell(
  dto: CardsExtendedCellIntentDTO,
): CardsExtendedCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "cardsExtended",
    columns: dto.columns,
    align: dto.align,
    reveal: dto.reveal,
    items: dto.items.map(adaptCardsExtendedItem),
  };
}
