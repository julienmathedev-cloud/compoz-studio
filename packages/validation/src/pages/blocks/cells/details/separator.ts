/**
 * @file packages/validation/src/pages/blocks/cells/details/separator.ts
 * @layer schemas
 * @description
 * Schéma Zod de SeparatorCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const SeparatorAlignSchema = z.enum(
  ["left", "center", "right", "full"],
  {
    message: ERROR_CODES.CELL_SEPARATOR_ALIGN_INVALID,
  },
);

export const SeparatorSizeSchema = z.enum(["sm", "md", "lg"], {
  message: ERROR_CODES.CELL_SEPARATOR_SIZE_INVALID,
});

export const SeparatorCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("separator"),
    align: SeparatorAlignSchema,
    size: SeparatorSizeSchema,
  })
  .strict();
