/**
 * @file packages/validation/src/pages/blocks/cells/details/rich-text.ts
 * @layer schemas
 * @description
 * Schéma Zod de RichTextCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const RichTextCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("richText"),

    content: z.string(),

    reveal: z.boolean({
      message: ERROR_CODES.RICH_TEXT_REVEAL_INVALID,
    }),
  })
  .strict();
