/**
 * @file packages/validation/src/pages/blocks/cells/details/gallery.ts
 * @layer schemas
 * @description
 * Schéma Zod de GalleryCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";

export const GalleryMaxColumnsSchema = z.union(
  [
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ] as const,
  { message: ERROR_CODES.GALLERY_MAX_COLUMNS_INVALID },
);

export const GalleryCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("gallery"),
    linksEnabled: z.boolean(),
    maxColumns: GalleryMaxColumnsSchema,
    reveal: z.boolean({
      message: ERROR_CODES.GALLERY_REVEAL_INVALID,
    }),
    items: z.array(ImageEditorSchema).min(1, ERROR_CODES.CELL_IMAGES_MIN_1),
  })
  .strict();
