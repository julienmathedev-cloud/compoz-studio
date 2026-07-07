/**
 * @file packages/ui/src/pages/mappers/cells/carousel.ts
 * @layer ui/pages/mappers
 * @description Maps carousel cell DTOs to form values.
 * @remarks
 * Cell-level options stay here, while reusable item shapes are delegated to item mappers.
 */

import type {
  CardItemDTO,
  CarouselCellDTO,
  ExtendedCardItemDTO,
  ImageEditorDTO,
  StructuredCardItemDTO,
} from "@compoz/core/domain/pages/dto";
import { toCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/card-item";
import { toExtendedCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/extended-card-item";
import { toStructuredCardItemsShapeFromDTO } from "@compoz/ui/pages/mappers/items/structured-card-item";
import type { CarouselCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type WithDims = { width?: number | null; height?: number | null };

function coerceDims<T extends WithDims>(img: T): T {
  return {
    ...img,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

export function toCarouselCellShapeFromDTO(
  cell: CarouselCellDTO,
): CarouselCellFormValues {
  const itemKind = cell.itemKind;

  const items =
    itemKind === "image"
      ? (cell.items as ReadonlyArray<ImageEditorDTO>).map((item) =>
          coerceDims(item),
        )
      : itemKind === "card"
        ? toCardItemsShapeFromDTO(cell.items as CardItemDTO[])
        : itemKind === "extendedCard"
          ? toExtendedCardItemsShapeFromDTO(cell.items as ExtendedCardItemDTO[])
          : toStructuredCardItemsShapeFromDTO(
              cell.items as StructuredCardItemDTO[],
            );

  return {
    id: cell.id,
    kind: "carousel",
    cssClassName: cell.cssClassName,
    variant: cell.variant,
    showDots: cell.showDots,
    showArrows: cell.showArrows,
    itemKind,
    items,
  };
}
