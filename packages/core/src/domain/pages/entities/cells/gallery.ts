/**
 * @file packages/core/src/domain/pages/entities/cells/gallery.ts
 * @layer core/domain/pages
 * @description
 * Entité métier GalleryCell.
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image";

export type GalleryMaxColumns = 1 | 2 | 3 | 4 | 5;

export type GalleryCell = {
  id: string;
  kind: "gallery";
  linksEnabled: boolean;
  maxColumns: GalleryMaxColumns;
  items: ReadonlyArray<ImageEditor>;
};
