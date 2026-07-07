/**
 * @file packages/ui/src/pages/mappers/cells/gallery.ts
 * @layer ui/pages/mappers
 * @description Maps gallery cell DTOs to form values.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { GalleryCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = String(value ?? "").trim();

  return trimmed ? trimmed : undefined;
}

export function toGalleryCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "gallery" }>,
): GalleryCellFormValues {
  return {
    id: cell.id,
    kind: "gallery",
    cssClassName: cell.cssClassName,
    linksEnabled: cell.linksEnabled,
    maxColumns: cell.maxColumns,
    reveal: cell.reveal,
    items: cell.items.map((item) => {
      const mediaAssetId = optionalTrimmedString(item.mediaAssetId);

      return {
        id: item.id,
        src: item.src,
        alt: item.alt,
        caption: item.caption,
        href: item.href,
        width: item.width,
        height: item.height,
        ...(mediaAssetId ? { mediaAssetId } : {}),
      };
    }),
  };
}
