/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Pending-state and double-invocation tests for list conflict actions.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  areBlockListConflictActionsDisabled,
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
