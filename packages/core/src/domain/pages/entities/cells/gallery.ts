/**
 * @file packages/core/src/domain/pages/entities/cells/gallery.ts
 * @layer core/domain/pages
 * @description
 * Entité métier GalleryCell.
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image-editor";

export type GalleryMaxColumns = 1 | 2 | 3 | 4 | 5 | 6;

export type GalleryCell = {
  id: string;
  kind: "gallery";
  cssClassName?: string;
  linksEnabled: boolean;
  maxColumns: GalleryMaxColumns;
  reveal: boolean;
  items: ReadonlyArray<ImageEditor>;
};
