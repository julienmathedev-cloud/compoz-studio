/**
 * @file packages/ui/src/pages/mappers/items/structured-card-item.ts
 * @layer ui/pages/mappers
 * @description Maps reusable structured card item DTOs to form values.
 * @remarks
 * Cell-level options remain in parent mappers such as card collections and carousels.
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
