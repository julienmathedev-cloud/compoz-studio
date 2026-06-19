/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/items/card-item.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for simple card items.
 *
 * @remarks
 * This adapter only handles the reusable card item shape.
 * Cell-level concerns such as `kind`, `columns`, `align`, `reveal`,
 * `cssClassName`, and `items` are handled by parent cell adapters such as
 * `cardCollection` or `carousel`.
 */

import type { CardItem } from "@compoz/core/domain/pages/entities/cell";
import type { CardItemIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

import { trimOrKeep } from "@compoz/studio/lib/strings";

export function adaptCardItem(dto: CardItemIntentDTO): CardItem {
  return {
    id: trimOrKeep(dto.id),
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),
    icon: dto.icon ? (trimOrKeep(dto.icon) as CardItem["icon"]) : null,
  };
}
