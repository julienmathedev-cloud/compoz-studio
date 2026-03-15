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
    caption: z.string().optional(),
    href: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_IMAGE_HREF_INVALID)
      .nullable()
      .optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasSrc = data.src.trim().length > 0;

    if (hasSrc) {
      if (!data.width) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["width"],
          message: ERROR_CODES.CELL_IMAGE_WIDTH_REQUIRED,
        });
      }

      if (!data.height) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["height"],
          message: ERROR_CODES.CELL_IMAGE_HEIGHT_REQUIRED,
        });
      }
    }
  });

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
    variant: ImageVariantSchema.optional(),
  })
  .strict();
