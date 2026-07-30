/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.test.ts
 * @layer studio/features/pages/blocks/cache
 * @description Monotone Page block snapshot adoption tests.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import { adoptPageBlocksSnapshot } from "@compoz/studio/features/pages/blocks/cache/cache";

function snapshot(id: string, blocksRevision: number): PageBlocksSnapshotDTO {
  return {
    blocksRevision,
    blocks: [{
      id,
      type: "section",
      name: id,
      containerMode: "contained",
      lcpPriority: false,
      rows: [],
    }],
  };
}

void test("newer is adopted while equal and stale snapshots are ignored", () => {
  const current = snapshot("current", 3);
  const newer = snapshot("newer", 4);
  assert.strictEqual(adoptPageBlocksSnapshot(undefined, current), current);
  assert.strictEqual(adoptPageBlocksSnapshot(current, newer), newer);
  assert.strictEqual(
    adoptPageBlocksSnapshot(current, snapshot("equal", 3)),
    current,
  );
  assert.strictEqual(
    adoptPageBlocksSnapshot(current, snapshot("stale", 2)),
    current,
  );
});

void test("an authoritative conflict snapshot replaces equal optimistic state but never newer state", () => {
  const optimistic = snapshot("optimistic", 4);
  const authoritative = snapshot("server", 4);
  assert.strictEqual(
    adoptPageBlocksSnapshot(optimistic, authoritative, true),
    authoritative,
  );
  assert.strictEqual(
    adoptPageBlocksSnapshot(snapshot("newer", 5), authoritative, true).blocks[0]
      ?.id,
    "newer",
  );
});
