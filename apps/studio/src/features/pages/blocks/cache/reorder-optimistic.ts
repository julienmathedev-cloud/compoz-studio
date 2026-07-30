/**
 * @file apps/studio/src/features/pages/blocks/cache/reorder-optimistic.ts
 * @layer studio/features/pages/blocks/cache
 * @description Pure revision-preserving optimistic reorder and guarded rollback predicates.
 */

import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";

export function optimisticReorderSnapshot(
  snapshot: PageBlocksSnapshotDTO,
  localOrder: ReadonlyArray<string>,
): PageBlocksSnapshotDTO {
  const byId = new Map(snapshot.blocks.map((block) => [block.id, block]));
  const intended = localOrder
    .filter((id, index) => localOrder.indexOf(id) === index)
    .map((id) => byId.get(id))
    .filter((block): block is NonNullable<typeof block> => Boolean(block));
  const intendedIds = new Set(intended.map((block) => block.id));
  let intendedIndex = 0;

  return {
    blocksRevision: snapshot.blocksRevision,
    blocks: snapshot.blocks.map((block) =>
      intendedIds.has(block.id)
        ? intended[intendedIndex++] ?? block
        : block,
    ),
  };
}

export function canRollbackOptimisticReorder(input: Readonly<{
  current: PageBlocksSnapshotDTO | undefined;
  previous: PageBlocksSnapshotDTO;
  optimisticOrder: ReadonlyArray<string>;
}>): boolean {
  return Boolean(
    input.current &&
      input.current.blocksRevision === input.previous.blocksRevision &&
      input.current.blocks.length === input.optimisticOrder.length &&
      input.current.blocks.every(
        (block, index) => block.id === input.optimisticOrder[index],
      ),
  );
}
