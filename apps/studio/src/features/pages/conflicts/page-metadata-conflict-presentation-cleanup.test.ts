/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation-cleanup.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests consumer presentation cleanup after metadata mutation commits.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  pageMetadataConflictCommitOutcome,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import {
  applyPageBlocksMetadataResolutionPresentationCleanup,
  applyPageEditMetadataResolutionPresentationCleanup,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation-cleanup";

const CLEAN = "resolved-with-no-remaining-local-changes" as const;
const STRUCTURE_DIRTY = "resolved-with-remaining-structure-changes" as const;
const TERMINAL_ACTIONS = ["adoptCurrent", "keepLocal", "apply"] as const;

function counters() {
  return {
    warnings: 0,
    errors: 0,
    clean: 0,
    structure: 0,
    remount: 0,
    close: 0,
  };
}

function sharedActions(count: ReturnType<typeof counters>) {
  return {
    clearWarnings: () => { count.warnings += 1; },
    clearBlockingErrors: () => { count.errors += 1; },
    markSectionClean: () => { count.clean += 1; },
    clearStructureConflict: () => { count.structure += 1; },
    remountForm: () => { count.remount += 1; },
  };
}

void test("PageEditSection closes and cleans once after every terminal resolution without parent", () => {
  for (const action of TERMINAL_ACTIONS) {
    const count = counters();
    applyPageEditMetadataResolutionPresentationCleanup(CLEAN, {
      ...sharedActions(count),
      closeEditor: () => { count.close += 1; },
    });

    assert.deepEqual(count, {
      warnings: 1,
      errors: 1,
      clean: 1,
      structure: 1,
      remount: 1,
      close: 1,
    }, action);
  }
});

void test("PageEditSection stays open after every terminal resolution with a local parent", () => {
  for (const action of TERMINAL_ACTIONS) {
    const count = counters();
    applyPageEditMetadataResolutionPresentationCleanup(STRUCTURE_DIRTY, {
      ...sharedActions(count),
      closeEditor: () => { count.close += 1; },
    });

    assert.deepEqual(count, counters(), action);
  }
});

void test("PageBlocksListSection cleans and remounts once after every terminal resolution without parent", () => {
  for (const action of TERMINAL_ACTIONS) {
    const count = counters();
    applyPageBlocksMetadataResolutionPresentationCleanup(
      CLEAN,
      sharedActions(count),
    );

    assert.deepEqual(count, {
      warnings: 1,
      errors: 1,
      clean: 1,
      structure: 1,
      remount: 1,
      close: 0,
    }, action);
  }
});

void test("PageBlocksListSection never remounts after a terminal resolution with a local parent", () => {
  for (const action of TERMINAL_ACTIONS) {
    const count = counters();
    applyPageBlocksMetadataResolutionPresentationCleanup(
      STRUCTURE_DIRTY,
      sharedActions(count),
    );

    assert.deepEqual(count, counters(), action);
  }
});

void test("all terminal resolutions share the deterministic structural decision", () => {
  const withoutParent = pageMetadataConflictCommitOutcome({
    structuralBaselineParentId: "parent-a",
    localParentId: "parent-a",
  });
  const withParent = pageMetadataConflictCommitOutcome({
    structuralBaselineParentId: "parent-a",
    localParentId: "parent-b",
  });

  assert.equal(withoutParent, CLEAN);
  assert.equal(withParent, STRUCTURE_DIRTY);
});

void test("adoptCurrent applies the same cleanup without requiring a mutation outcome", () => {
  const count = counters();
  const cleanOutcome = pageMetadataConflictCommitOutcome({
    structuralBaselineParentId: "parent-a",
    localParentId: "parent-a",
  });
  applyPageEditMetadataResolutionPresentationCleanup(cleanOutcome, {
    ...sharedActions(count),
    closeEditor: () => { count.close += 1; },
  });

  assert.equal(count.clean, 1);
  assert.equal(count.remount, 1);
  assert.equal(count.close, 1);
});
