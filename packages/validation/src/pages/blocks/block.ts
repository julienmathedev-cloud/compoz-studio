/**
 * @file packages/validation/src/pages/blocks/block.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la structure frontière des blocks (sections) d’une page.
 *
 * Ces schémas valident uniquement la forme (API / infra).
 * Les invariants métier sont vérifiés dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

export const BlockIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.BLOCK_ID_REQUIRED);

export const BlockRowIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.BLOCK_ID_REQUIRED);

export const BlockColumnIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.BLOCK_ID_REQUIRED);

export const BlockNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.BLOCK_NAME_REQUIRED);

export const BlockRowColumnsCountSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)] as const,
  { message: ERROR_CODES.BLOCK_SECTION_COLUMNS_INVALID },
);

export const SectionBlockContainerModeSchema = z.enum(
  ["contained", "fullBleed"] as const,
  { message: ERROR_CODES.BLOCK_SECTION_CONTAINER_MODE_INVALID },
);

/* -------------------------------------------------------------------------- */
/*                                   Column                                   */
/* -------------------------------------------------------------------------- */

export const BlockColumnSchema = z
  .object({
    id: BlockColumnIdSchema,
    cells: z.array(CellSchema),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                    Row                                     */
/* -------------------------------------------------------------------------- */

export const BlockRowSchema = z
  .object({
    id: BlockRowIdSchema,
    columnsCount: BlockRowColumnsCountSchema,
    columns: z.array(BlockColumnSchema),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Block                                    */
/* -------------------------------------------------------------------------- */

export const SectionBlockSchema = z
  .object({
    id: BlockIdSchema,
    type: z.literal("section"),
    name: BlockNameSchema,
    containerMode: SectionBlockContainerModeSchema,
    lcpPriority: z.boolean(),
    rows: z.array(BlockRowSchema),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                Union future                                */
/* -------------------------------------------------------------------------- */

export const BlockSchema = z.discriminatedUnion("type", [SectionBlockSchema]);

export type BlockShape = z.infer<typeof BlockSchema>;
export type SectionBlockShape = z.infer<typeof SectionBlockSchema>;
export type BlockRowShape = z.infer<typeof BlockRowSchema>;
export type BlockColumnShape = z.infer<typeof BlockColumnSchema>;
export type BlockNameShape = z.infer<typeof BlockNameSchema>;
