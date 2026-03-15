/**
 * @file packages/validation/src/pages/blocks/cells/details/spacer.ts
 * @layer schemas
 * @description
 * Schéma Zod de SpacerCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const SpacerSizeSchema = z.enum(["sm", "md", "lg", "xl"], {
  message: ERROR_CODES.CELL_INVALID,
});

export const SpacerCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("spacer"),
    size: SpacerSizeSchema,
  })
  .strict();
