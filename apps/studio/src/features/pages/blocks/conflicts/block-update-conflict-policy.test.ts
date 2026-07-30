/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-update-conflict-policy.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Conflict-kind action policy tests for the block update panel.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type {
  BlockConflict,
  PageBlocksConflictDetails,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { blockUpdateConflictPolicy } from "@compoz/studio/features/pages/blocks/conflicts/block-update-conflict-policy";

function details(
  conflicts: ReadonlyArray<BlockConflict>,
  conflictKind: PageBlocksConflictDetails["conflictKind"] = "functional",
): PageBlocksConflictDetails {
  return {
    resourceId: "page",
    expectedBlocksRevision: 1,
    currentBlocksRevision: 2,
    operation: "update",
    conflictKind,
    conflictingPaths: conflicts.map((conflict) => conflict.path),
    conflicts,
    current: { blocks: [], blocksRevision: 2 },
  };
}

const field: BlockConflict = {
  kind: "fieldConflict",
  path: "blocks[block].name",
  location: {
    kind: "blockField",
    blockId: "block",
    segments: [{ kind: "field", name: "name" }],
  },
  baseline: "Base",
  current: "Remote",
  local: "Local",
};

void test("Apply requires choices for every conflict and rejects mixed structural conflicts", () => {
  const unresolvedField = blockUpdateConflictPolicy({
    details: details([field]),
    choices: {},
  });
  assert.equal(unresolvedField.showApply, true);
  assert.equal(unresolvedField.canApply, false);
  const resolvedField = blockUpdateConflictPolicy({
    details: details([field]),
    choices: { 0: "remote" },
  });
  assert.equal(resolvedField.showApply, true);
  assert.equal(resolvedField.canApply, true);
  const mixed = blockUpdateConflictPolicy({
    details: details([
      field,
      {
        kind: "itemTypeChanged",
        path: "blocks[block].itemKind",
        baseline: "image",
        current: "card",
        local: "image",
      },
    ]),
    choices: { 0: "local" },
  });
  assert.equal(mixed.canApply, false);
  assert.equal(mixed.requiresManualRebase, true);
  assert.equal(mixed.showAdoptCurrent, true);
  assert.equal(mixed.showKeepDraft, true);
  assert.equal(mixed.showApply, false);
  assert.equal(mixed.showDeletedActions, false);
});

void test("structural collection and global conflicts offer draft preservation and current adoption", () => {
  for (const conflict of [
    {
      kind: "collectionIncompatible" as const,
      path: "blocks[block].rows",
      baseline: [],
      current: [],
      local: [],
    },
    {
      kind: "globalInvariant" as const,
      path: "blocks",
      invariant: "BLOCKS_INVALID",
    },
    {
      kind: "itemTypeChanged" as const,
      path: "blocks[block].itemKind",
      baseline: "image",
      current: "card",
      local: "image",
    },
  ]) {
    const policy = blockUpdateConflictPolicy({
      details: details([conflict]),
      choices: {},
    });
    assert.equal(policy.canApply, false);
    assert.equal(policy.showApply, false);
    assert.equal(policy.showKeepDraft, true);
    assert.equal(policy.showAdoptCurrent, true);
  }
});

void test("deleted, changed-before-delete, and contention expose only their matching actions", () => {
  const deleted = blockUpdateConflictPolicy({
    details: details([{
      kind: "blockDeleted",
      path: "blocks[block]",
      blockId: "block",
    }]),
    choices: {},
  });
  assert.equal(deleted.showDeletedActions, true);
  assert.equal(deleted.showDeleteChangedActions, false);
  assert.equal(deleted.showApply, false);

  const changed = blockUpdateConflictPolicy({
    details: details([{
      kind: "blockChangedBeforeDelete",
      path: "blocks[block]",
      blockId: "block",
      baseline: {
        id: "block",
        type: "section",
        name: "Base",
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      },
      current: {
        id: "block",
        type: "section",
        name: "Remote",
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      },
    }]),
    choices: {},
  });
  assert.equal(changed.showDeleteChangedActions, true);
  assert.equal(changed.showDeletedActions, false);
  assert.equal(changed.showApply, false);

  const contention = blockUpdateConflictPolicy({
    details: details([], "contention"),
    choices: {},
  });
  assert.equal(contention.showAdoptCurrent, true);
  assert.equal(contention.showApply, false);

  const revisionAhead = blockUpdateConflictPolicy({
    details: details([{
      kind: "revisionAhead",
      path: "blocksRevision",
      expectedBlocksRevision: 3,
      currentBlocksRevision: 2,
    }]),
    choices: {},
  });
  assert.equal(revisionAhead.showAdoptCurrent, true);
  assert.equal(revisionAhead.showApply, false);
});
