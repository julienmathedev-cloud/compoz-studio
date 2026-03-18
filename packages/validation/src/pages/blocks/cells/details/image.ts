/**
 * @file packages/validation/src/pages/blocks/cells/details/image.ts
 * @layer schemas
 * @description
 * Schémas Zod de ImageCell et ImageEditor.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellIdSchema,
  ImageEditorIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const ImageEditorSchema = z
  .object({
    id: ImageEditorIdSchema,
    src: z.string().trim().min(1, ERROR_CODES.CELL_IMAGE_SRC_REQUIRED),
    alt: z.string(),
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
    width: z
      .number({
        message: ERROR_CODES.CELL_IMAGE_WIDTH_REQUIRED,
      })
      .int()
      .positive(ERROR_CODES.CELL_IMAGE_WIDTH_REQUIRED),
    height: z
      .number({
        message: ERROR_CODES.CELL_IMAGE_HEIGHT_REQUIRED,
      })
      .int()
      .positive(ERROR_CODES.CELL_IMAGE_HEIGHT_REQUIRED),
  })
  .strict();

export const ImageVariantSchema = z.enum(
  ["default", "wide", "square", "portrait"] as const,
  {
    message: ERROR_CODES.IMAGE_VARIANT_INVALID,
  },
);

export const ImageCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("image"),
    image: ImageEditorSchema,
    variant: ImageVariantSchema,
    reveal: z.boolean({
      message: ERROR_CODES.IMAGE_REVEAL_INVALID,
    }),
  })
  .strict();
