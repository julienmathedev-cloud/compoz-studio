/**
 * @file packages/validation/src/pages/blocks/cells/details/image-editor.ts
 * @layer schemas
 * @description
 * Schémas Zod de ImageCell et ImageEditor.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ImageSchema } from "@compoz/validation/common/image";
import {
  CellIdSchema,
  ImageEditorIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const ImageEditorSchema = ImageSchema.extend({
  id: ImageEditorIdSchema,
  caption: z
    .string({
      message: ERROR_CODES.CELL_IMAGE_CAPTION_INVALID,
    })
    .trim()
    .nullable(),
  href: z
    .string({
      message: ERROR_CODES.CELL_IMAGE_HREF_INVALID,
    })
    .trim()
    .min(1, ERROR_CODES.CELL_IMAGE_HREF_INVALID)
    .nullable(),
}).strict();

export const ImageVariantSchema = z.enum(
  ["default", "wide", "square", "portrait"] as const,
  {
    message: ERROR_CODES.IMAGE_VARIANT_INVALID,
  },
);

export const ImageSizeSchema = z.enum(["sm", "md", "lg", "full"] as const, {
  message: ERROR_CODES.IMAGE_SIZE_INVALID,
});

export const ImageCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("image"),
    image: ImageEditorSchema,
    variant: ImageVariantSchema,
    size: ImageSizeSchema,
    reveal: z.boolean({
      message: ERROR_CODES.IMAGE_REVEAL_INVALID,
    }),
  })
  .strict();
