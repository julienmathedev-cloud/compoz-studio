/**
 * @file packages/validation/src/pages/blocks/cells/details/case-study-card.ts
 * @layer schemas
 * @description
 * Schémas Zod de la cellule CaseStudyCard.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image";

export const CaseStudyCardItemSchema = z
  .object({
    id: CellIdSchema,
    image: ImageEditorSchema.optional(),
    title: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    context: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    solution: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
    result: z.string().trim().min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();

export const CaseStudyCardColumnsSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const CaseStudyCardCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("caseStudyCard"),
    columns: CaseStudyCardColumnsSchema,
    items: z.array(CaseStudyCardItemSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
