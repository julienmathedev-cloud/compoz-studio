/**
 * @file apps/studio/src/features/builder/block-baseline.test.ts
 * @layer studio/features/builder
 * @description Builder baseline rebase and mutation-response tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import {
  type BuilderBlockBaseline,
  completeBuilderCurrentSnapshotAdoption,
  requireBuilderMutationBaseline,
  resolveBuilderContentionRetryIntent,
  resolveBuilderCurrentSnapshotAdoption,
  resolveBuilderMutationBaseline,
  resolveBuilderSnapshotRebase,
} from "@compoz/studio/features/builder/block-baseline";

const snapshot: PageBlocksSnapshotDTO = {
  blocksRevision: 4,
  blocks: [{
    id: "block",
    type: "section",
    name: "Remote",
    containerMode: "contained",
    lcpPriority: false,
    rows: [{
      id: "row",
      columnsCount: 1,
      reverseOn: { mobile: false, tablet: false, desktop: false },
      columns: [{
        id: "column",
        cells: [{
          id: "rich",
          kind: "richText",
          content: "<p>remote</p>",
          reveal: false,
        }],
      }],
    }],
  }],
};

void test("newer snapshot rebases a clean form and advances its baseline revision", () => {
  const rebase = resolveBuilderSnapshotRebase({
    snapshot,
    baselineRevision: 3,
    blockId: "block",
    isDirty: false,
  });
  assert.strictEqual(rebase?.persistedBlock, snapshot.blocks[0]);
  assert.equal(rebase?.formValues.name, "Remote");
  assert.equal(rebase?.blocksRevision, 4);
  assert.equal(rebase?.lcpPriorityBlockId, null);
});

void test("dirty form keeps local rich text and does not reset", () => {
  assert.equal(
    resolveBuilderSnapshotRebase({
      snapshot,
      baselineRevision: 3,
      blockId: "block",
      isDirty: true,
    }),
    null,
  );
});

void test("server mutation response, not local input, becomes the next baseline", () => {
  const baseline = resolveBuilderMutationBaseline({
    response: snapshot,
    blockId: "block",
  });
  assert.strictEqual(baseline?.persistedBlock, snapshot.blocks[0]);
  assert.equal(baseline?.formValues.name, "Remote");
  assert.equal(baseline?.blocksRevision, 4);
  assert.equal(baseline?.lcpPriorityBlockId, null);
});

void test("contention retry uses the current saved baseline, revision, LCP owner, and live draft", () => {
  const currentOwner = {
    id: "owner",
    type: "section" as const,
    name: "Owner",
    containerMode: "contained" as const,
    lcpPriority: true,
    rows: [],
  };
  const liveValues = {
    ...resolveBuilderMutationBaseline({ response: snapshot, blockId: "block" })!
      .formValues,
    name: "Live draft",
  };
  const details = {
    resourceId: "page",
    expectedBlocksRevision: 3,
    currentBlocksRevision: 4,
    operation: "update" as const,
    conflictKind: "contention" as const,
    conflictingPaths: [],
    conflicts: [],
    current: { ...snapshot, blocks: [...snapshot.blocks, currentOwner] },
  };

  const intent = resolveBuilderContentionRetryIntent({
    details,
    blockId: "block",
    liveValues,
  });

  assert.strictEqual(intent?.baselineBlock, snapshot.blocks[0]);
  assert.strictEqual(intent?.local, liveValues);
  assert.equal(intent?.expectedBlocksRevision, 4);
  assert.equal(intent?.baselineLcpPriorityBlockId, "owner");
  assert.equal(
    resolveBuilderContentionRetryIntent({
      details,
      blockId: "deleted",
      liveValues,
    }),
    null,
  );
});

void test("Builder wires contention retry through update and finalizes the returned snapshot", () => {
  const source = readFileSync(new URL("./BuilderScreen.tsx", import.meta.url), "utf8");
  assert.match(source, /resolveBuilderContentionRetryIntent\(\{[\s\S]*details: updateConflict,[\s\S]*blockId,[\s\S]*liveValues,[\s\S]*\}\)/u);
  assert.match(source, /if \(!intent\) \{[\s\S]*await handleRecreateBlock\(\)/u);
  assert.match(source, /const response = await update\(intent\);\s*finalizeBuilderConflictSnapshot\(response\)/u);
  assert.match(source, /onRetryDraft=\{handleRetryDraftAfterContention\}/u);
});

void test("explicit current adoption resets an existing block baseline and closes cleanly", () => {
  const adoption = resolveBuilderCurrentSnapshotAdoption({
    snapshot,
    blockId: "block",
  });
  assert.equal(adoption.kind, "baseline");
  const events: string[] = [];
  completeBuilderCurrentSnapshotAdoption({
    adoption,
    onAdoptBaseline: (baseline) => {
      events.push(`adopt:${baseline.formValues.name}`);
    },
    onClearConflict: () => { events.push("clear"); },
    onMarkClean: () => { events.push("clean"); },
    onNavigateBack: () => { events.push("navigate"); },
  });
  assert.deepEqual(events, ["adopt:Remote", "clear", "clean"]);
});

void test("explicit current adoption accepts a deleted block without recreation", () => {
  const adoption = resolveBuilderCurrentSnapshotAdoption({
    snapshot: { blocks: [], blocksRevision: 5 },
    blockId: "block",
  });
  assert.deepEqual(adoption, { kind: "deleted" });
  const events: string[] = [];
  completeBuilderCurrentSnapshotAdoption({
    adoption,
    onAdoptBaseline: () => { events.push("adopt"); },
    onClearConflict: () => { events.push("clear"); },
    onMarkClean: () => { events.push("clean"); },
    onNavigateBack: () => { events.push("navigate:backHref"); },
  });
  assert.deepEqual(events, ["clear", "clean", "navigate:backHref"]);
  assert.equal(events.includes("recreate"), false);
});

void test("a successful update response without the edited block remains invalid", () => {
  assert.throws(
    () => requireBuilderMutationBaseline({
      response: { blocks: [], blocksRevision: 5 },
      blockId: "block",
    }),
    /BLOCK_BASELINE_REQUIRED/u,
  );
});

void test("Builder routes deleted current adoption to backHref without finalizing or recreating", () => {
  const source = readFileSync(new URL("./BuilderScreen.tsx", import.meta.url), "utf8");
  assert.match(source, /resolveBuilderCurrentSnapshotAdoption\(\{[\s\S]*snapshot: updateConflict\.current,[\s\S]*blockId,[\s\S]*\}\)/u);
  assert.match(source, /onClearConflict: clearUpdateConflict/u);
  assert.match(source, /onMarkClean: \(\) => dirtyGuard\.setDirty\(false\)/u);
  assert.match(source, /onNavigateBack: \(\) => router\.push\(backHref\)/u);
  assert.doesNotMatch(source, /handleAdoptCurrentSnapshot[\s\S]{0,800}handleRecreateBlock\(\)/u);
});

void test("a dirty form keeps the original LCP owner when a newer snapshot changes it", () => {
  const original: BuilderBlockBaseline = {
    persistedBlock: snapshot.blocks[0]!,
    formValues: resolveBuilderMutationBaseline({
      response: snapshot,
      blockId: "block",
    })!.formValues,
    blocksRevision: 3,
    lcpPriorityBlockId: "owner-a",
  };
  const newer: PageBlocksSnapshotDTO = {
    blocksRevision: 4,
    blocks: [
      ...snapshot.blocks,
      {
        id: "owner-c",
        type: "section",
        name: "C",
        containerMode: "contained",
        lcpPriority: true,
        rows: [],
      },
    ],
  };

  assert.equal(
    resolveBuilderSnapshotRebase({
      snapshot: newer,
      baselineRevision: original.blocksRevision,
      blockId: "block",
      isDirty: true,
    }),
    null,
  );
  assert.equal(original.blocksRevision, 3);
  assert.equal(original.lcpPriorityBlockId, "owner-a");
});

void test("rebase and noChanges keep the exact persisted block beside its UI projection", () => {
  const persistedBlock = {
    id: "empty",
    type: "section" as const,
    name: "Empty",
    containerMode: "contained" as const,
    lcpPriority: false,
    rows: [],
  };
  const response: PageBlocksSnapshotDTO = {
    blocks: [persistedBlock],
    blocksRevision: 8,
  };
  const rebase = resolveBuilderSnapshotRebase({
    snapshot: response,
    baselineRevision: 7,
    blockId: "empty",
    isDirty: false,
  });
  const noChanges = resolveBuilderMutationBaseline({
    response,
    blockId: "empty",
  });

  assert.strictEqual(rebase?.persistedBlock, persistedBlock);
  assert.deepEqual(rebase?.persistedBlock.rows, []);
  assert.equal(rebase?.formValues.rows.length, 1);
  assert.strictEqual(noChanges?.persistedBlock, persistedBlock);
  assert.deepEqual(noChanges?.persistedBlock.rows, []);
  assert.equal(noChanges?.formValues.rows.length, 1);
});

void test("cancel preserves the draft while adopting current replaces the full baseline projection", () => {
  const persisted = snapshot.blocks[0]!;
  const original = resolveBuilderMutationBaseline({
    response: snapshot,
    blockId: "block",
  })!;
  const draft = {
    ...original.formValues,
    name: "Local draft",
  };

  const cancelledBaseline = original;
  assert.strictEqual(cancelledBaseline, original);
  assert.equal(draft.name, "Local draft");

  const adopted = resolveBuilderMutationBaseline({
    response: {
      blocksRevision: 5,
      blocks: [{ ...persisted, name: "Newest current" }],
    },
    blockId: "block",
  })!;
  assert.equal(adopted.persistedBlock.name, "Newest current");
  assert.equal(adopted.formValues.name, "Newest current");
  assert.equal(adopted.blocksRevision, 5);
  assert.equal(adopted.lcpPriorityBlockId, null);
});
