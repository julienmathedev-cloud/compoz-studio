/**
 * @file packages/ui/src/pages/mappers/items/extended-card-item.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Shared runtime mapper for extended card items.
 *
 * @remarks
 * This mapper only handles the reusable extended card item shape.
 * Cell-level concerns such as `kind`, `columns`, `align`, `reveal`,
 * `cssClassName`, and `items` are handled by parent cell mappers such as
 * `cardCollection` or `carousel`.
 */

import type { ExtendedCardItemDTO } from "@compoz/core/domain/pages/dto";
import type { ExtendedCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toExtendedCardItemShapeFromDTO(
  item: ExtendedCardItemDTO,
): ExtendedCardItemFormValues {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    bullets: [...item.bullets],
    footer: item.footer,
    icon: item.icon,
  };
}

export function toExtendedCardItemsShapeFromDTO(
  items: ReadonlyArray<ExtendedCardItemDTO>,
): ExtendedCardItemFormValues[] {
  return items.map(toExtendedCardItemShapeFromDTO);
}
