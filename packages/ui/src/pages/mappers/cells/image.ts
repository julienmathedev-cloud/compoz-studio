/**
 * @file packages/ui/src/pages/mappers/cells/image.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `image`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { ImageCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type WithDims = { width?: number | null; height?: number | null };

function coerceDims<T extends WithDims>(img: T): T {
  return {
    ...img,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

export function toImageCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "image" }>,
): ImageCellFormValues {
  return {
    id: cell.id,
    kind: "image",
    image: coerceDims(cell.image),
    variant: cell.variant,
  };
}
