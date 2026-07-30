/**
 * @file apps/studio/src/features/builder/block-baseline.ts
 * @layer studio/features/builder
 * @description Pure Builder baseline decisions for revisioned Page block snapshots.
 */

import type {
  BlockDTO,
  PageBlocksSnapshotDTO,
} from "@compoz/core/domain/pages/dto";
import { toSectionBlockFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/blocks-form";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

export type BuilderBlockBaseline = Readonly<{
  persistedBlock: BlockDTO;
  formValues: SectionBlockFormValues;
  blocksRevision: number;
  lcpPriorityBlockId: string | null;
}>;

export function resolveBuilderSnapshotRebase(input: Readonly<{
  snapshot: PageBlocksSnapshotDTO;
  baselineRevision: number;
  blockId: string;
  isDirty: boolean;
}>): BuilderBlockBaseline | null {
  if (
    input.isDirty ||
    input.snapshot.blocksRevision <= input.baselineRevision
  ) {
    return null;
  }
  const block = input.snapshot.blocks.find(
    (candidate) => candidate.id === input.blockId,
  );
  if (!block) return null;
  return {
    persistedBlock: block,
    formValues: toSectionBlockFormValuesFromDTO(block),
    blocksRevision: input.snapshot.blocksRevision,
    lcpPriorityBlockId:
      input.snapshot.blocks.find((candidate) => candidate.lcpPriority)?.id ??
      null,
  };
}

export function resolveBuilderMutationBaseline(input: Readonly<{
  response: PageBlocksSnapshotDTO;
  blockId: string;
}>): BuilderBlockBaseline | null {
  const block = input.response.blocks.find(
    (candidate) => candidate.id === input.blockId,
  );
  if (!block) return null;
  return {
    persistedBlock: block,
    formValues: toSectionBlockFormValuesFromDTO(block),
    blocksRevision: input.response.blocksRevision,
    lcpPriorityBlockId:
      input.response.blocks.find((candidate) => candidate.lcpPriority)?.id ??
      null,
  };
}
