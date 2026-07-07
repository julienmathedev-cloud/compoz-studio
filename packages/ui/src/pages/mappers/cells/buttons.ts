/**
 * @file packages/ui/src/pages/mappers/cells/buttons.ts
 * @layer ui/pages/mappers
 * @description Maps buttons cell DTOs to form values.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { ButtonsCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toButtonsCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "buttons" }>,
): ButtonsCellFormValues {
  return {
    id: cell.id,
    kind: "buttons",
    cssClassName: cell.cssClassName,
    align: cell.align,
    gap: cell.gap,
    items: cell.items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      variant: item.variant,
      icon: item.icon,
      iconPosition: item.iconPosition === "after" ? "after" : "before",
    })),
  };
}
