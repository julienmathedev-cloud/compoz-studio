/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/cards.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `CardsCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  CardItem,
  CardsCell,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  CardItemIntentDTO,
  CardsCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptCardItem(dto: CardItemIntentDTO): CardItem {
  return {
    id: trimOrKeep(dto.id),
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),
    icon: dto.icon ? trimOrKeep(dto.icon) : undefined,
  };
}

export function adaptCardsCell(dto: CardsCellIntentDTO): CardsCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "cards",
    columns: dto.columns,
    align: dto.align,
    items: dto.items.map(adaptCardItem),
  };
}
