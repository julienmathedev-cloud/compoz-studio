/**
 * @file apps/studio/src/features/pages/blocks/cache/reorder-optimistic.test.ts
 * @layer studio/features/pages/blocks/cache
 * @description Revision-aware optimistic reorder rollback tests.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import {
  canRollbackOptimisticReorder,
  optimisticReorderSnapshot,
} from "@compoz/studio/features/pages/blocks/cache/reorder-optimistic";

const block = (id: string) => ({
  id,
  type: "section" as const,
  name: id,
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [],
});
const previous: PageBlocksSnapshotDTO = {
  blocks: [block("a"), block("b")],
  blocksRevision: 4,
};

void test("optimism preserves the complete revision and rollback snapshot", () => {
  const optimistic = optimisticReorderSnapshot(previous, ["b", "a"]);
  assert.equal(optimistic.blocksRevision, 4);
  assert.deepEqual(optimistic.blocks.map((item) => item.id), ["b", "a"]);
  assert.deepEqual(previous.blocks.map((item) => item.id), ["a", "b"]);
  assert.equal(
    canRollbackOptimisticReorder({
      current: optimistic,
      previous,
      optimisticOrder: ["b", "a"],
    }),
    true,
  );
});

void test("a newer snapshot or changed order blocks stale rollback", () => {
  assert.equal(
    canRollbackOptimisticReorder({
      current: { ...previous, blocksRevision: 5 },
      previous,
      optimisticOrder: ["a", "b"],
    }),
    false,
  );
  assert.equal(
    canRollbackOptimisticReorder({
      current: previous,
      previous,
      optimisticOrder: ["b", "a"],
    }),
    false,
  );
});

void test("optimism reorders intended IDs without hiding a remotely added ID", () => {
  const current = {
    blocks: [block("a"), block("remote"), block("b")],
    blocksRevision: 5,
  };
  const optimistic = optimisticReorderSnapshot(current, ["b", "a"]);
  assert.deepEqual(
    optimistic.blocks.map((item) => item.id),
    ["b", "remote", "a"],
  );
  assert.equal(
    canRollbackOptimisticReorder({
      current: optimistic,
      previous: current,
      optimisticOrder: ["b", "remote", "a"],
    }),
    true,
  );
});
