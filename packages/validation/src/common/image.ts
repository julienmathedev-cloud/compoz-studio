/**
 * @file packages/validation/src/common/image.ts
 * @layer schemas
 * @description
 * Schéma Zod partagé décrivant un objet image canonique.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

export const ImageSchema = z
  .object({
    src: z.string().trim().min(1, ERROR_CODES.CELL_IMAGE_SRC_REQUIRED),
    alt: z.string().trim().min(1, ERROR_CODES.CELL_IMAGE_ALT_INVALID),
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

export type ImageShape = z.infer<typeof ImageSchema>;
