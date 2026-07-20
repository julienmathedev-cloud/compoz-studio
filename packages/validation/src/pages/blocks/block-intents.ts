/**
 * @file packages/validation/src/pages/blocks/block-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing section block intent payloads.
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

const OrderedBlockIdsIntentSchema = z
  .array(BlockIdSchema)
  .min(1, ERROR_CODES.BLOCKS_INVALID);

/**
 * Draft-friendly column payload.
 *
 * @remarks
 * `id` may be omitted because the domain layer generates it when needed.
 */
const CreateBlockColumnIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    cells: z.array(CellSchema),
  })
  .strict();

/**
 * Draft-friendly row payload.
 *
 * @remarks
 * `id` and `reverseOn` may be omitted because the domain layer fills the
 * missing structural defaults.
 */
const CreateBlockRowIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    columnsCount: BlockRowColumnsCountSchema,
    reverseOn: BlockRowReverseOnSchema.partial().optional(),
    columns: z.array(CreateBlockColumnIntentSchema),
  })
  .strict();

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

export const ReorderBlocksIntentSchema = z
  .object({
    orderedBlockIds: OrderedBlockIdsIntentSchema,
  })
  .strict();

export type ReorderBlocksIntentDTO = z.infer<typeof ReorderBlocksIntentSchema>;
