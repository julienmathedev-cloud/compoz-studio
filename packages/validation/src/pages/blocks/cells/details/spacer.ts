/**
 * @file packages/validation/src/pages/blocks/cells/details/spacer.ts
 * @layer schemas
 * @description
 * Schéma Zod de SpacerCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const SpacerSizeSchema = z.enum(["sm", "md", "lg", "xl"], {
  message: ERROR_CODES.CELL_SPACER_SIZE_INVALID,
});

export const SpacerVisibilitySchema = z
  .object({
    mobile: z.boolean({
      message: ERROR_CODES.CELL_SPACER_VISIBILITY_INVALID,
    }),
    tablet: z.boolean({
      message: ERROR_CODES.CELL_SPACER_VISIBILITY_INVALID,
    }),
    desktop: z.boolean({
      message: ERROR_CODES.CELL_SPACER_VISIBILITY_INVALID,
    }),
  })
  .strict();

export const SpacerCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("spacer"),
    cssClassName: CellCssClassNameSchema,
    size: SpacerSizeSchema,
    visibility: SpacerVisibilitySchema,
  })
  .strict();
