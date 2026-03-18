/**
 * @file packages/ui/src/pages/mappers/cells/gallery.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `gallery`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { GalleryCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toGalleryCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "gallery" }>,
): GalleryCellFormValues {
  return {
    id: cell.id,
    kind: "gallery",
    linksEnabled: cell.linksEnabled,
    maxColumns: cell.maxColumns,
    reveal: cell.reveal,
    items: cell.items.map((item) => ({
      id: item.id,
      src: item.src,
      alt: item.alt,
      caption: item.caption,
      href: item.href,
      width: item.width,
      height: item.height,
    })),
  };
}
