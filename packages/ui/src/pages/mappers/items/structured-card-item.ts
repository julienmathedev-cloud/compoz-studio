/**
 * @file packages/ui/src/pages/mappers/items/structured-card-item.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Shared runtime mapper for structured card items.
 *
 * @remarks
 * This mapper only handles the reusable structured card item shape.
 * Cell-level concerns such as `kind`, `columns`, `reveal`, `cssClassName`,
 * and `items` are handled by parent cell mappers such as `cardCollection`
 * or `carousel`.
 */

import type { StructuredCardItemDTO } from "@compoz/core/domain/pages/dto";
import type { StructuredCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toStructuredCardItemShapeFromDTO(
  item: StructuredCardItemDTO,
): StructuredCardItemFormValues {
  return {
    id: item.id,
    image: item.image,
    title: item.title,
    meta: item.meta,
    sections: item.sections.map((section) => ({
      id: section.id,
      label: section.label,
      content: section.content,
    })),
    button: item.button
      ? {
          id: item.button.id,
          label: item.button.label,
          href: item.button.href,
          variant: item.button.variant,
          icon: item.button.icon,
          iconPosition:
            item.button.iconPosition === "after" ? "after" : "before",
        }
      : null,
  };
}

export function toStructuredCardItemsShapeFromDTO(
  items: ReadonlyArray<StructuredCardItemDTO>,
): StructuredCardItemFormValues[] {
  return items.map(toStructuredCardItemShapeFromDTO);
}
