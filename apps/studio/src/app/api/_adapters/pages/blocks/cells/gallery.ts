/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/gallery.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { GalleryCell } from "@compoz/core/domain/pages/entities/cell";
import type { GalleryCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";

export function adaptGalleryCell(dto: GalleryCellIntentDTO): GalleryCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "gallery",
    linksEnabled: dto.linksEnabled,
    maxColumns: dto.maxColumns,
    items: dto.items.map(adaptImage),
  };
}
