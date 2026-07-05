/**
 * @file packages/ui/src/pages/mappers/cells/image.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `image`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { ImageCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = String(value ?? "").trim();

  return trimmed ? trimmed : undefined;
}

/* -------------------------------------------------------------------------- */
/* Mapper                                                                     */
/* -------------------------------------------------------------------------- */

export function toImageCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "image" }>,
): ImageCellFormValues {
  const mediaAssetId = optionalTrimmedString(cell.image.mediaAssetId);

  return {
    id: cell.id,
    kind: "image",
    cssClassName: cell.cssClassName,
    image: {
      id: cell.image.id,
      src: cell.image.src,
      alt: cell.image.alt,
      caption: cell.image.caption,
      href: cell.image.href,
      width: cell.image.width,
      height: cell.image.height,
      ...(mediaAssetId ? { mediaAssetId } : {}),
    },
    variant: cell.variant,
    size: cell.size,
    reveal: cell.reveal,
    zoomEnabled: cell.zoomEnabled ?? false,
  };
}
