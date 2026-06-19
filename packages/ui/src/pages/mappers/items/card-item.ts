/**
 * @file packages/ui/src/pages/mappers/items/card-item.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Shared runtime mapper for simple card items.
 *
 * @remarks
 * This mapper only handles the reusable card item shape.
 * Cell-level concerns such as `kind`, `columns`, `align`, `reveal`,
 * `cssClassName`, and `items` are handled by parent cell mappers such as
 * `cardCollection` or `carousel`.
 */

import type { CardItemDTO } from "@compoz/core/domain/pages/dto";
import type { CardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCardItemShapeFromDTO(item: CardItemDTO): CardItemFormValues {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    icon: item.icon,
  };
}

export function toCardItemsShapeFromDTO(
  items: ReadonlyArray<CardItemDTO>,
): CardItemFormValues[] {
  return items.map(toCardItemShapeFromDTO);
}
