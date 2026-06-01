/**
 * @file packages/validation/src/pages/blocks/cells/details/common.ts
 * @layer schemas
 * @description
 * Atomes Zod partagés pour les cells.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

export const CellIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_ID_REQUIRED);

export const CellItemIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_ITEM_ID_REQUIRED);

export const ImageEditorIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_IMAGE_ID_REQUIRED);

export const CellCssClassNameSchema = z.string().trim().optional();
