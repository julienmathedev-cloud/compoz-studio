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

import { adaptOptionalButtonItem } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/buttons";
import { trimOrKeep } from "@compoz/studio/lib/strings";

export function adaptCardItem(dto: CardItemIntentDTO): CardItem {
  const eyebrow = dto.eyebrow ? trimOrKeep(dto.eyebrow) : "";

  return {
    id: trimOrKeep(dto.id),
    eyebrow: eyebrow.length > 0 ? eyebrow : null,
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),
    icon: dto.icon ?? null,
    button: adaptOptionalButtonItem(dto.button),
  };
}
