/**
 * @file packages/validation/src/pages/blocks/cells/details/timeline.ts
 * @layer schemas
 * @description
 * Schéma Zod de TimelineCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const TimelineKeywordSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_INVALID);

export const TimelineItemSchema = z
  .object({
    id: CellItemIdSchema,
    period: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    title: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    subtitle: z.string().trim().optional(),
    description: z.string().trim().optional(),
    badge: z.string().trim().optional(),
    keywords: z.array(TimelineKeywordSchema).optional(),
  })
  .strict();

export const TimelineCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("timeline"),
    items: z.array(TimelineItemSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
