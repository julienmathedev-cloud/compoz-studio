/**
 * @file packages/validation/src/pages/blocks/cells/details/heading.ts
 * @layer schemas
 * @description
 * Schéma Zod de HeadingCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";

export const HeadingLevelSchema = z.enum(["h1", "h2", "h3", "h4", "h5", "h6"], {
  message: ERROR_CODES.CELL_HEADING_LEVEL_INVALID,
});

export const HeadingAlignSchema = z.enum(["left", "center"], {
  message: ERROR_CODES.CELL_HEADING_ALIGN_INVALID,
});

export const HeadingVariantSchema = z.enum(["default", "hero"], {
  message: ERROR_CODES.CELL_HEADING_VARIANT_INVALID,
});

/**
 * ID d’ancre pour un heading.
 *
 * @remarks
 * - null = pas d’ancre
 * - "" est autorisé côté UI pour permettre une suppression simple dans le form
 * - si la valeur est non vide, elle doit respecter le format attendu
 */
export const HeadingAnchorIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[A-Za-z0-9_-]+$/.test(value),
    ERROR_CODES.CELL_HEADING_ID_ANCHOR_INVALID,
  )
  .nullable();

export const HeadingCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("heading"),
    cssClassName: CellCssClassNameSchema,

    level: HeadingLevelSchema,

    title: z.string().trim().min(1, ERROR_CODES.CELL_HEADING_TITLE_REQUIRED),

    subtitle: z.string().trim().nullable(),

    align: HeadingAlignSchema,

    variant: HeadingVariantSchema,

    separator: z.boolean({
      message: ERROR_CODES.CELL_HEADING_SEPARATOR_INVALID,
    }),

    idAnchor: HeadingAnchorIdSchema,

    reveal: z.boolean({
      message: ERROR_CODES.CELL_HEADING_REVEAL_INVALID,
    }),

    highlights: z
      .array(
        z.string().trim().min(1, ERROR_CODES.CELL_HEADING_HIGHLIGHT_INVALID),
        {
          message: ERROR_CODES.CELL_HEADING_HIGHLIGHTS_INVALID,
        },
      )
      .nullable(),
  })
  .strict();
