/**
 * @file packages/validation/src/pages/blocks/block-intents.ts
 * @layer schemas
 * @description Strict OCC intent schemas for draft Page block mutations.
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
  BlockSchema,
  SectionBlockContainerModeSchema,
} from "@compoz/validation/pages/blocks/block";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";

const BlocksRevisionSchema = z.number().int().min(0);
const BlockOrderSchema = z.array(BlockIdSchema);
const LcpOwnerSchema = BlockIdSchema.nullable();

function preserveValidatedInput<TSchema extends z.ZodType>(
  schema: TSchema,
): z.ZodCustom<z.input<TSchema>, z.input<TSchema>> {
  return z.custom<z.input<TSchema>>((value) => schema.safeParse(value).success);
}

const BaselineBlockOrderSchema = preserveValidatedInput(BlockOrderSchema);
const BaselineLcpOwnerSchema = preserveValidatedInput(LcpOwnerSchema);
const BaselineBlockNameSchema = preserveValidatedInput(BlockNameSchema);
const BaselineBlockRowsSchema = preserveValidatedInput(z.array(BlockRowSchema));
const BaselineBlockSchema = preserveValidatedInput(BlockSchema);

const CreateBlockColumnIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    cells: z.array(CellSchema),
  })
  .strict();

const CreateBlockRowIntentSchema = z
  .object({
    id: z.string().trim().optional(),
    columnsCount: BlockRowColumnsCountSchema,
    reverseOn: BlockRowReverseOnSchema.partial().optional(),
    columns: z.array(CreateBlockColumnIntentSchema),
  })
  .strict();

export const BlockPlacementSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("start") }).strict(),
  z.object({ kind: z.literal("end") }).strict(),
  z.object({ kind: z.literal("before"), blockId: BlockIdSchema }).strict(),
  z.object({ kind: z.literal("after"), blockId: BlockIdSchema }).strict(),
]);

export const CreateSectionBlockIntentSchema = z
  .object({
    expectedBlocksRevision: BlocksRevisionSchema,
    baselineOrder: BaselineBlockOrderSchema,
    baselineLcpPriorityBlockId: BaselineLcpOwnerSchema,
    placement: BlockPlacementSchema,
    name: BlockNameSchema.optional(),
    containerMode: SectionBlockContainerModeSchema,
    cssClassName: BlockCssClassNameSchema,
    lcpPriority: z.boolean(),
    rows: z.array(CreateBlockRowIntentSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.baselineOrder).size !== value.baselineOrder.length) {
      context.addIssue({
        code: "custom",
        path: ["baselineOrder"],
        message: ERROR_CODES.BLOCK_ORDER_INVALID,
      });
    }
  });

export type CreateSectionBlockIntentDTO = z.infer<
  typeof CreateSectionBlockIntentSchema
>;

function change<
  TBaselineSchema extends z.ZodType,
  TLocalSchema extends z.ZodType,
>(baselineSchema: TBaselineSchema, localSchema: TLocalSchema) {
  return z
    .object({ baseline: baselineSchema, local: localSchema })
    .strict();
}

const OptionalCssClassNameSchema = z.union([
  BlockCssClassNameSchema,
  z.undefined(),
]);
const BaselineOptionalCssClassNameSchema = preserveValidatedInput(
  OptionalCssClassNameSchema,
);

export const UpdateSectionBlockIntentSchema = z
  .object({
    expectedBlocksRevision: BlocksRevisionSchema,
    baselineLcpPriorityBlockId: BaselineLcpOwnerSchema,
    changes: z
      .object({
        name: change(BaselineBlockNameSchema, BlockNameSchema).optional(),
        containerMode: change(
          SectionBlockContainerModeSchema,
          SectionBlockContainerModeSchema,
        ).optional(),
        cssClassName: change(
          BaselineOptionalCssClassNameSchema,
          OptionalCssClassNameSchema,
        ).optional(),
        lcpPriority: change(z.boolean(), z.boolean()).optional(),
        rows: change(
          BaselineBlockRowsSchema,
          z.array(BlockRowSchema),
        ).optional(),
      })
      .strict(),
  })
  .strict();

export type UpdateSectionBlockIntentDTO = z.infer<
  typeof UpdateSectionBlockIntentSchema
>;

export const DeleteBlockIntentSchema = z
  .object({
    expectedBlocksRevision: BlocksRevisionSchema,
    baselineBlock: BaselineBlockSchema,
  })
  .strict();

export type DeleteBlockIntentDTO = z.infer<typeof DeleteBlockIntentSchema>;

export const ReorderBlocksIntentSchema = z
  .object({
    expectedBlocksRevision: BlocksRevisionSchema,
    baselineOrder: BaselineBlockOrderSchema,
    localOrder: BlockOrderSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const baseline = new Set(value.baselineOrder);
    const local = new Set(value.localOrder);
    if (
      baseline.size !== value.baselineOrder.length ||
      local.size !== value.localOrder.length ||
      baseline.size !== local.size ||
      [...baseline].some((id) => !local.has(id))
    ) {
      context.addIssue({
        code: "custom",
        path: ["localOrder"],
        message: ERROR_CODES.BLOCK_ORDER_INVALID,
      });
    }
  });

export type ReorderBlocksIntentDTO = z.infer<typeof ReorderBlocksIntentSchema>;
