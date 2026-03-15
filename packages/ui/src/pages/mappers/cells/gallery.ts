/**
 * @file packages/ui/src/pages/mappers/cells/gallery.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `gallery`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { GalleryCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type WithDims = { width?: number | null; height?: number | null };

function coerceDims<T extends WithDims>(img: T): T {
  return {
    ...img,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

export function toGalleryCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "gallery" }>,
): GalleryCellFormValues {
  return {
    id: cell.id,
    kind: "gallery",
    linksEnabled: cell.linksEnabled,
    maxColumns: cell.maxColumns,
    items: [...cell.items].map(coerceDims),
  };
}
