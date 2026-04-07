/**
 * @file packages/ui/src/pages/mappers/cells/image.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `image`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { ImageCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toImageCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "image" }>,
): ImageCellFormValues {
  return {
    id: cell.id,
    kind: "image",
    image: {
      id: cell.image.id,
      src: cell.image.src,
      alt: cell.image.alt,
      caption: cell.image.caption,
      href: cell.image.href,
      width: cell.image.width,
      height: cell.image.height,
    },
    variant: cell.variant,
    size: cell.size,
    reveal: cell.reveal,
  };
}
