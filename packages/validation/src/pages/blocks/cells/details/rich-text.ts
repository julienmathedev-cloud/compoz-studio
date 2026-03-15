/**
 * @file packages/validation/src/pages/blocks/cells/details/rich-text.ts
 * @layer schemas
 * @description
 * Schéma Zod de RichTextCell.
 */

import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const RichTextCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("richText"),
    content: z.string(),
  })
  .strict();
