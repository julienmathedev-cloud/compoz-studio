/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Completion tests for list conflict mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { completeBlockListConflictMutation } from "@compoz/studio/features/pages/blocks/conflicts/block-list-conflict-actions";

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
