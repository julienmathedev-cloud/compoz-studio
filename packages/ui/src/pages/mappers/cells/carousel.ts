/**
 * @file packages/ui/src/pages/mappers/cells/carousel.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `carousel`.
 */

import type {
  CardItemDTO,
  CardsExtendedItemDTO,
  CarouselCellDTO,
  ImageEditorDTO,
  StructuredCardItemDTO,
} from "@compoz/core/domain/pages/dto";
import { toCardsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards";
import { toCardsExtendedCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards-extended";
import { toStructuredCardCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/structured-card";
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
  const items =
    cell.itemKind === "image"
      ? (cell.items as ReadonlyArray<ImageEditorDTO>).map((item) =>
          coerceDims(item),
        )
      : cell.itemKind === "card"
        ? toCardsCellShapeFromDTO({
            id: cell.id,
            kind: "cards",
            columns: 2,
            align: "left",
            reveal: true,
            items: cell.items as CardItemDTO[],
          }).items
        : cell.itemKind === "cardsExtended"
          ? toCardsExtendedCellShapeFromDTO({
              id: cell.id,
              kind: "cardsExtended",
              columns: 2,
              align: "left",
              reveal: true,
              items: cell.items as CardsExtendedItemDTO[],
            }).items
          : toStructuredCardCellShapeFromDTO({
              id: cell.id,
              kind: "structuredCard",
              columns: 1,
              reveal: true,
              items: cell.items as StructuredCardItemDTO[],
            }).items;

  return {
    id: cell.id,
    kind: "carousel",
    variant: cell.variant,
    showDots: cell.showDots,
    showArrows: cell.showArrows,
    itemKind: cell.itemKind,
    items,
  };
}
