/**
 * @file packages/ui/src/pages/mappers/items/card-item.ts
 * @layer ui/pages/mappers
 * @description Maps reusable card item DTOs to form values.
 * @remarks
 * Cell-level options remain in parent mappers such as card collections and carousels.
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
