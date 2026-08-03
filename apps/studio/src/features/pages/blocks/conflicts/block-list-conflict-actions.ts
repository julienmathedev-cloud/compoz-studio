/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Completion helper for Page block-list conflict mutations.
 */

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export type BlockDeleteConflictRetryDecision =
  | Readonly<{ kind: "retry"; blockId: string }>
  | Readonly<{ kind: "adopt-current" }>
  | Readonly<{ kind: "unavailable" }>;

export function resolveBlockDeleteConflictRetry(input: Readonly<{
  details: PageBlocksConflictDetails;
  failedBlockId: string;
}>): BlockDeleteConflictRetryDecision {
  const changed = input.details.conflicts.find(
    (conflict) => conflict.kind === "blockChangedBeforeDelete",
  );
  const blockId = changed?.kind === "blockChangedBeforeDelete"
    ? changed.blockId
    : input.details.conflictKind === "contention"
      ? input.failedBlockId
      : null;
  if (!blockId) return { kind: "unavailable" };
  return input.details.current.blocks.some((block) => block.id === blockId)
    ? { kind: "retry", blockId }
    : { kind: "adopt-current" };
}

export async function completeBlockListConflictMutation(input: Readonly<{
  mutate: () => void | Promise<void>;
  clearConflict: () => void;
}>): Promise<void> {
  await input.mutate();
  input.clearConflict();
}

export async function completeBlockDeleteConflictRetry(input: Readonly<{
  decision: Exclude<BlockDeleteConflictRetryDecision, { kind: "unavailable" }>;
  remove: (blockId: string) => unknown | Promise<unknown>;
  adoptCurrent: () => void;
  clearConflict: () => void;
}>): Promise<void> {
  if (input.decision.kind === "adopt-current") {
    input.adoptCurrent();
    input.clearConflict();
    return;
  }
  const blockId = input.decision.blockId;
  await completeBlockListConflictMutation({
    mutate: async () => {
      await input.remove(blockId);
    },
    clearConflict: input.clearConflict,
  });
}
