/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/gallery.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { GalleryCell } from "@compoz/core/domain/pages/entities/cell";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import type { GalleryCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptGalleryCell(dto: GalleryCellIntentDTO): GalleryCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "gallery",
    linksEnabled: dto.linksEnabled,
    maxColumns: dto.maxColumns,
    reveal: dto.reveal,
    items: dto.items.map(adaptImage),
  };
}
