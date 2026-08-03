/**
 * @file apps/studio/src/features/pages/blocks/hooks/delete-block-conflict-state.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Delete conflict target retention and hook cleanup contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createDeleteBlockConflictState } from "@compoz/studio/features/pages/blocks/hooks/delete-block-conflict-state";

const details = {
  resourceId: "page",
  expectedBlocksRevision: 2,
  currentBlocksRevision: 3,
  operation: "delete" as const,
  conflictKind: "contention" as const,
  conflictingPaths: [],
  conflicts: [],
  current: { blocks: [], blocksRevision: 3 },
};

void test("pairs a delete conflict with the failed mutation target", () => {
  assert.deepEqual(createDeleteBlockConflictState(details, "target-block"), {
    details,
    blockId: "target-block",
  });
});

void test("the delete hook captures onError variables and clears the paired state", () => {
  const source = readFileSync(new URL("./useDeleteBlock.ts", import.meta.url), "utf8");
  assert.match(source, /onError: \(error, blockId\)/u);
  assert.match(source, /createDeleteBlockConflictState\(details, blockId\)/u);
  assert.match(source, /onSuccess:[\s\S]*setConflict\(null\)/u);
  assert.match(source, /clearConflict: \(\) => setConflict\(null\)/u);
});
