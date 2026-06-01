/**
 * @file packages/validation/src/pages/blocks/block-intents.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant les intentions liées aux blocks (sections).
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  BlockCssClassNameSchema,
  BlockIdSchema,
  BlockNameSchema,
  BlockRowColumnsCountSchema,
  BlockRowReverseOnSchema,
  BlockRowSchema,
  SectionBlockContainerModeSchema,
} from "@compoz/validation/pages/blocks/block";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const OrderedBlockIdsIntentSchema = z
  .array(BlockIdSchema)
  .min(1, ERROR_CODES.BLOCKS_INVALID);

/* -------------------------------------------------------------------------- */
/*                         Create helpers (draft-friendly)                    */
/* -------------------------------------------------------------------------- */

/**
 * Colonne de création :
 * - `id` optionnel (généré côté domaine si absent)
 * - `cells` requis
 */
const CreateBlockColumnIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    cells: z.array(CellSchema),
  })
  .strict();

/**
 * Ligne de création :
 * - `id` optionnel (généré côté domaine si absent)
 * - `columnsCount` requis
 * - `reverseOn` optionnel (normalisé côté domaine si absent)
 * - `columns` requis
 */
const CreateBlockRowIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    columnsCount: BlockRowColumnsCountSchema,
    reverseOn: BlockRowReverseOnSchema.partial().optional(),
    columns: z.array(CreateBlockColumnIntentSchema),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                               Create Block                                 */
/* -------------------------------------------------------------------------- */

export const CreateSectionBlockIntentSchema = z
  .object({
    name: BlockNameSchema.optional(),
    containerMode: SectionBlockContainerModeSchema,
    cssClassName: BlockCssClassNameSchema,
    lcpPriority: z.boolean(),
    rows: z.array(CreateBlockRowIntentSchema),
    insertAt: z.number().int().min(0).optional(),
  })
  .strict();

export type CreateSectionBlockIntentDTO = z.infer<
  typeof CreateSectionBlockIntentSchema
>;

/* -------------------------------------------------------------------------- */
/*                               Update Block                                 */
/* -------------------------------------------------------------------------- */

export const UpdateSectionBlockIntentSchema = z
  .object({
    blockId: BlockIdSchema,
    patch: z
      .object({
        name: BlockNameSchema.optional(),
        containerMode: SectionBlockContainerModeSchema.optional(),
        cssClassName: BlockCssClassNameSchema,
        lcpPriority: z.boolean().optional(),
        rows: z.array(BlockRowSchema).optional(),
      })
      .strict(),
  })
  .strict();

export type UpdateSectionBlockIntentDTO = z.infer<
  typeof UpdateSectionBlockIntentSchema
>;

/* -------------------------------------------------------------------------- */
/*                               Delete Block                                 */
/* -------------------------------------------------------------------------- */

export const DeleteBlockIntentSchema = z
  .object({
    blockId: BlockIdSchema,
  })
  .strict();

export type DeleteBlockIntentDTO = z.infer<typeof DeleteBlockIntentSchema>;

/* -------------------------------------------------------------------------- */
/*                              Reorder Blocks                                */
/* -------------------------------------------------------------------------- */

export const ReorderBlocksIntentSchema = z
  .object({
    orderedBlockIds: OrderedBlockIdsIntentSchema,
  })
  .strict();

export type ReorderBlocksIntentDTO = z.infer<typeof ReorderBlocksIntentSchema>;
