/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Pending-state and double-invocation tests for list conflict actions.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  areBlockListConflictActionsDisabled,
  completeBlockListConflictMutation,
  createBlockListConflictActionLock,
} from "@compoz/studio/features/pages/blocks/conflicts/block-list-conflict-actions";

void test("a double retry while create is pending invokes the mutation once", async () => {
  const lock = createBlockListConflictActionLock();
  let invocationCount = 0;
  let release: (() => void) | undefined;
  const pendingMutation = new Promise<void>((resolve) => {
    release = resolve;
  });
  const retryCreate = async () => {
    invocationCount++;
    await pendingMutation;
  };

  const firstClick = lock.run(retryCreate);
  const secondClick = lock.run(retryCreate);

  assert.equal(lock.isPending(), true);
  assert.equal(invocationCount, 1);
  assert.equal(await secondClick, false);
  release?.();
  assert.equal(await firstClick, true);
  assert.equal(lock.isPending(), false);
});

void test("external or local pending state disables every panel action", () => {
  assert.equal(
    areBlockListConflictActionsDisabled({
      isPending: false,
      isActionPending: false,
    }),
    false,
  );
  assert.equal(
    areBlockListConflictActionsDisabled({
      isPending: true,
      isActionPending: false,
    }),
    true,
  );
  assert.equal(
    areBlockListConflictActionsDisabled({
      isPending: false,
      isActionPending: true,
    }),
    true,
  );
});

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
