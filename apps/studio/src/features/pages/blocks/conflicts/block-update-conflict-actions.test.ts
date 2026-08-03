/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-update-conflict-actions.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Ensures contention uses only adoption or explicit draft retry actions.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { BlockConflict, PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import {
  requiresFullVersionBlockResolution,
  selectBlockConflictPanelScenario,
  toBlockConflictPresentation,
} from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";
import { executeBlockUpdateConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/block-update-conflict-actions";

void test("contention server choice adopts current without resolving or retrying", async () => {
  const calls: string[] = [];
  const result = await executeBlockUpdateConflictChoice({
    scenarioKind: "contention",
    allServer: true,
    indexedChoices: {},
    onAdoptCurrent: () => { calls.push("adopt"); },
    onRetryDraft: () => { calls.push("retry"); },
    onResolve: () => { calls.push("resolve"); },
  });

  assert.equal(result.status, "success");
  assert.deepEqual(calls, ["adopt"]);
});

void test("contention local choice retries the draft without resolving or adopting", async () => {
  const calls: string[] = [];
  const result = await executeBlockUpdateConflictChoice({
    scenarioKind: "contention",
    allServer: false,
    indexedChoices: {},
    onAdoptCurrent: () => { calls.push("adopt"); },
    onRetryDraft: () => { calls.push("retry"); },
    onResolve: () => { calls.push("resolve"); },
  });

  assert.equal(result.status, "success");
  assert.deepEqual(calls, ["retry"]);
});

void test("a missing contention callback is an action error", async () => {
  assert.deepEqual(await executeBlockUpdateConflictChoice({
    scenarioKind: "contention",
    allServer: false,
    indexedChoices: {},
    onResolve: () => assert.fail("contention must not resolve a candidate"),
  }), { status: "error" });
});

void test("every non-granular choice is one executable full-version decision", async () => {
  const structural = (
    kind: "blockTypeChanged" | "cellTypeChanged" | "itemTypeChanged" | "collectionIncompatible",
  ): BlockConflict => ({
    kind,
    path: `blocks[block].${kind}`,
    baseline: { value: "baseline" },
    current: { value: "current" },
    local: { value: "local" },
  });
  const conflicts: readonly BlockConflict[] = [
    { kind: "idReused", path: "blocks[block].rows[row]", id: "row" },
    { kind: "anchorMissing", path: "blocks[block].rows", id: "row" },
    structural("blockTypeChanged"),
    structural("cellTypeChanged"),
    structural("itemTypeChanged"),
    structural("collectionIncompatible"),
  ];

  for (const conflict of conflicts) {
    const details: PageBlocksConflictDetails = {
      resourceId: "page",
      expectedBlocksRevision: 1,
      currentBlocksRevision: 2,
      operation: "update",
      conflictKind: "functional",
      conflictingPaths: [conflict.path],
      conflicts: [conflict],
      current: { blocks: [], blocksRevision: 2 },
    };
    assert.equal(requiresFullVersionBlockResolution(details), true);
    const presentation = toBlockConflictPresentation(details, (key) => key);
    assert.equal(presentation[0]?.items.length, 1);
    assert.equal(presentation[0]?.items[0]?.resolutionMode, "choice");
    assert.deepEqual(presentation[0]?.items[0]?.options, {
      server: "choices.keepSavedVersion",
      local: conflict.kind === "anchorMissing"
        ? "choices.retryDraft"
        : "choices.keepMyChange",
    });

    const scenario = selectBlockConflictPanelScenario(details);
    const calls: string[] = [];
    await executeBlockUpdateConflictChoice({
      scenarioKind: scenario.kind,
      allServer: true,
      indexedChoices: {},
      onAdoptCurrent: () => { calls.push("adopt"); },
      onRetryDraft: () => { calls.push("retry"); },
      onResolve: () => { calls.push("resolve"); },
    });
    await executeBlockUpdateConflictChoice({
      scenarioKind: scenario.kind,
      allServer: false,
      indexedChoices: {},
      onAdoptCurrent: () => { calls.push("adopt"); },
      onRetryDraft: () => { calls.push("retry"); },
      onResolve: () => { calls.push("resolve"); },
    });
    assert.deepEqual(calls, ["adopt", "retry"], conflict.kind);
  }
});
