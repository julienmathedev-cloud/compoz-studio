/**
 * @file packages/validation/src/pages/blocks/cells/details/timeline.ts
 * @layer schemas
 * @description
 * Schéma Zod de TimelineCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
  CellItemIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const TimelineKeywordSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_TIMELINE_ITEM_KEYWORD_INVALID);

export const TimelineItemSchema = z
  .object({
    id: CellItemIdSchema,
    period: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_TIMELINE_ITEM_PERIOD_REQUIRED),
    title: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_TIMELINE_ITEM_TITLE_REQUIRED),
    subtitle: z
      .string({
        message: ERROR_CODES.CELL_TIMELINE_ITEM_SUBTITLE_INVALID,
      })
      .trim()
      .nullable(),
    description: z
      .string({
        message: ERROR_CODES.CELL_TIMELINE_ITEM_DESCRIPTION_INVALID,
      })
      .trim()
      .nullable(),
    badge: z
      .string({
        message: ERROR_CODES.CELL_TIMELINE_ITEM_BADGE_INVALID,
      })
      .trim()
      .nullable(),
    keywords: z.array(TimelineKeywordSchema, {
      message: ERROR_CODES.CELL_TIMELINE_ITEM_KEYWORDS_INVALID,
    }),
  })
  .strict();

export const TimelineCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("timeline"),
    cssClassName: CellCssClassNameSchema,
    collapsible: z.boolean({
      message: ERROR_CODES.CELL_TIMELINE_COLLAPSIBLE_INVALID,
    }),
    items: z
      .array(TimelineItemSchema, {
        message: ERROR_CODES.CELL_TIMELINE_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_TIMELINE_ITEMS_MIN_1),
  })
  .strict();
