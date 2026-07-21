/**
 * @file packages/ui/src/pages/mappers/items/extended-card-item.ts
 * @layer ui/pages/mappers
 * @description Maps reusable extended card item DTOs to form values.
 * @remarks
 * Cell-level options remain in parent mappers such as card collections and carousels.
 */
import type { ExtendedCardItemDTO } from "@compoz/core/domain/pages/dto";
import type { ExtendedCardItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";
export function toExtendedCardItemShapeFromDTO(
  item: ExtendedCardItemDTO,
): ExtendedCardItemFormValues {
  return {
    id: item.id,
    eyebrow: item.eyebrow ?? null,
    title: item.title,
    description: item.description,
    bullets: [...item.bullets],
    footer: item.footer,
    icon: item.icon,
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
export function toExtendedCardItemsShapeFromDTO(
  items: ReadonlyArray<ExtendedCardItemDTO>,
): ExtendedCardItemFormValues[] {
  return items.map(toExtendedCardItemShapeFromDTO);
}
