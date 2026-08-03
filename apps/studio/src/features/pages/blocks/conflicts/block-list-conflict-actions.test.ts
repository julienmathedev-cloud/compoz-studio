/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Completion tests for list conflict mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  completeBlockDeleteConflictRetry,
  completeBlockListConflictMutation,
  resolveBlockDeleteConflictRetry,
} from "@compoz/studio/features/pages/blocks/conflicts/block-list-conflict-actions";

const block = (id: string) => ({
  id,
  type: "section" as const,
  name: id,
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [],
});

function deleteDetails(input: Readonly<{
  conflictKind?: "functional" | "contention";
  currentIds: readonly string[];
  changedBlockId?: string;
}>) {
  return {
    resourceId: "page",
    expectedBlocksRevision: 2,
    currentBlocksRevision: 3,
    operation: "delete" as const,
    conflictKind: input.conflictKind ?? "functional",
    conflictingPaths: [],
    conflicts: input.changedBlockId ? [{
      kind: "blockChangedBeforeDelete" as const,
      path: `blocks[${input.changedBlockId}]`,
      blockId: input.changedBlockId,
      baseline: block(input.changedBlockId),
      current: block(input.changedBlockId),
    }] : [],
    current: {
      blocks: input.currentIds.map(block),
      blocksRevision: 3,
    },
  };
}

void test("clears the conflict only after a successful mutation", async () => {
  const events: string[] = [];
  await completeBlockListConflictMutation({
    mutate: async () => {
      events.push("mutation-started");
      await Promise.resolve();
      events.push("mutation-succeeded");
    },
    clearConflict: () => events.push("conflict-cleared"),
  });
  assert.deepEqual(events, [
    "mutation-started",
    "mutation-succeeded",
    "conflict-cleared",
  ]);
});

void test("keeps a rejected conflict open, propagates the error, and permits a retry", async () => {
  let clearCount = 0;
  let attempt = 0;
  const run = () => completeBlockListConflictMutation({
    mutate: async () => {
      attempt++;
      if (attempt === 1) throw new Error("mutation rejected");
    },
    clearConflict: () => clearCount++,
  });

  await assert.rejects(run(), /mutation rejected/);
  assert.equal(clearCount, 0);
  await run();
  assert.equal(attempt, 2);
  assert.equal(clearCount, 1);
});

void test("contention retries the exact failed delete while the block still exists", async () => {
  const decision = resolveBlockDeleteConflictRetry({
    details: deleteDetails({ conflictKind: "contention", currentIds: ["target"] }),
    failedBlockId: "target",
  });
  assert.deepEqual(decision, { kind: "retry", blockId: "target" });
  if (decision.kind !== "retry") return;

  const events: string[] = [];
  await completeBlockDeleteConflictRetry({
    decision,
    remove: (blockId) => { events.push(`remove:${blockId}`); },
    adoptCurrent: () => events.push("adopt"),
    clearConflict: () => events.push("clear"),
  });
  assert.deepEqual(events, ["remove:target", "clear"]);
});

void test("contention adopts current without mutation when the block is already absent", async () => {
  const decision = resolveBlockDeleteConflictRetry({
    details: deleteDetails({ conflictKind: "contention", currentIds: [] }),
    failedBlockId: "target",
  });
  assert.deepEqual(decision, { kind: "adopt-current" });
  if (decision.kind !== "adopt-current") return;

  const events: string[] = [];
  await completeBlockDeleteConflictRetry({
    decision,
    remove: (blockId) => { events.push(`remove:${blockId}`); },
    adoptCurrent: () => { events.push("adopt"); },
    clearConflict: () => { events.push("clear"); },
  });
  assert.deepEqual(events, ["adopt", "clear"]);
});

void test("blockChangedBeforeDelete retains its business conflict target", () => {
  assert.deepEqual(resolveBlockDeleteConflictRetry({
    details: deleteDetails({ currentIds: ["changed"], changedBlockId: "changed" }),
    failedBlockId: "different-mutation-id",
  }), { kind: "retry", blockId: "changed" });
});
