/**
 * @file apps/studio/src/features/builder/block-baseline.ts
 * @layer studio/features/builder
 * @description Pure Builder baseline decisions for revisioned Page block snapshots.
 */

import type {
  BlockDTO,
  PageBlocksSnapshotDTO,
} from "@compoz/core/domain/pages/dto";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { toSectionBlockFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/blocks-form";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

export type BuilderBlockBaseline = Readonly<{
  persistedBlock: BlockDTO;
  formValues: SectionBlockFormValues;
  blocksRevision: number;
  lcpPriorityBlockId: string | null;
}>;

export type BuilderContentionRetryIntent = Readonly<{
  blockId: string;
  baselineBlock: BlockDTO;
  local: SectionBlockFormValues;
  expectedBlocksRevision: number;
  baselineLcpPriorityBlockId: string | null;
}>;

export type BuilderCurrentSnapshotAdoption =
  | Readonly<{ kind: "baseline"; baseline: BuilderBlockBaseline }>
  | Readonly<{ kind: "deleted" }>;

export function resolveBuilderContentionRetryIntent(input: Readonly<{
  details: PageBlocksConflictDetails;
  blockId: string;
  liveValues: SectionBlockFormValues;
}>): BuilderContentionRetryIntent | null {
  const baselineBlock = input.details.current.blocks.find(
    (block) => block.id === input.blockId,
  );
  if (!baselineBlock) return null;
  return {
    blockId: input.blockId,
    baselineBlock,
    local: input.liveValues,
    expectedBlocksRevision: input.details.currentBlocksRevision,
    baselineLcpPriorityBlockId:
      input.details.current.blocks.find((block) => block.lcpPriority)?.id ??
      null,
  };
}

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

export function requireBuilderMutationBaseline(input: Readonly<{
  response: PageBlocksSnapshotDTO;
  blockId: string;
}>): BuilderBlockBaseline {
  const baseline = resolveBuilderMutationBaseline(input);
  if (!baseline) throw new Error("BLOCK_BASELINE_REQUIRED");
  return baseline;
}

export function resolveBuilderCurrentSnapshotAdoption(input: Readonly<{
  snapshot: PageBlocksSnapshotDTO;
  blockId: string;
}>): BuilderCurrentSnapshotAdoption {
  const baseline = resolveBuilderMutationBaseline({
    response: input.snapshot,
    blockId: input.blockId,
  });
  return baseline ? { kind: "baseline", baseline } : { kind: "deleted" };
}

export function completeBuilderCurrentSnapshotAdoption(input: Readonly<{
  adoption: BuilderCurrentSnapshotAdoption;
  onAdoptBaseline: (baseline: BuilderBlockBaseline) => void;
  onClearConflict: () => void;
  onMarkClean: () => void;
  onNavigateBack: () => void;
}>): void {
  if (input.adoption.kind === "baseline") {
    input.onAdoptBaseline(input.adoption.baseline);
  }
  input.onClearConflict();
  input.onMarkClean();
  if (input.adoption.kind === "deleted") input.onNavigateBack();
}
