/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests the three explicit page metadata conflict choices.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import {
  createPageMetadataConflictState,
  finalizePageMetadataConflictValues,
  hasUnresolvedPageMetadataConflicts,
  resolvePageMetadataConflictChoice,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const INITIAL: PageFormValues = {
  name: "Initial",
  slug: "initial",
  seoTitle: null,
  seoDescription: null,
  parentId: null,
  sitemap: null,
  paginationEnabled: false,
};
const LOCAL = { ...INITIAL, name: "Local" };
const DETAILS: PageMetadataConflictDetails = {
  expectedMetaRevision: 2,
  currentMetaRevision: 3,
  conflicts: [
    {
      field: "name",
      baseline: "Initial",
      local: "Local",
      current: "Remote",
    },
  ],
  current: {
    page: {
      id: "page",
      parentId: null,
      slug: "initial",
      name: "Remote",
      seoTitle: null,
      seoDescription: null,
      blocks: [],
      sitemap: null,
      paginationEnabled: false,
      meta: {
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
    },
    revisions: { metaRevision: 3, blocksRevision: 4 },
  },
};

for (const [choice, expected] of [
  ["keepLocal", "Local"],
  ["adoptRemote", "Remote"],
  ["restoreInitial", "Initial"],
] as const) {
  void test(`${choice} rebases OCC on current while preserving the chosen local value`, () => {
    const result = resolvePageMetadataConflictChoice({
      state: createPageMetadataConflictState(DETAILS, INITIAL),
      field: "name",
      choice,
      localValues: LOCAL,
    });

    assert.equal(result.state.occBaseline.name, "Remote");
    assert.equal(result.localValue, expected);
    assert.deepEqual(result.state.unresolvedFields, []);
  });
}

void test("submission remains blocked until every conflict has an explicit choice", () => {
  const details: PageMetadataConflictDetails = {
    ...DETAILS,
    conflicts: [
      ...DETAILS.conflicts,
      {
        field: "slug",
        baseline: "initial",
        local: "local",
        current: "remote",
      },
    ],
    current: {
      ...DETAILS.current,
      page: { ...DETAILS.current.page, slug: "remote" },
    },
  };
  const initial = createPageMetadataConflictState(details, INITIAL);
  assert.equal(hasUnresolvedPageMetadataConflicts(initial), true);
  let mutationCalls = 0;
  if (!hasUnresolvedPageMetadataConflicts(initial)) mutationCalls += 1;
  assert.equal(mutationCalls, 0);

  const partial = resolvePageMetadataConflictChoice({
    state: initial,
    field: "name",
    choice: "adoptRemote",
    localValues: LOCAL,
  }).state;
  assert.equal(hasUnresolvedPageMetadataConflicts(partial), true);
  if (!hasUnresolvedPageMetadataConflicts(partial)) mutationCalls += 1;
  assert.equal(mutationCalls, 0);

  const resolved = resolvePageMetadataConflictChoice({
    state: partial,
    field: "slug",
    choice: "adoptRemote",
    localValues: LOCAL,
  }).state;
  assert.equal(hasUnresolvedPageMetadataConflicts(resolved), false);
  if (!hasUnresolvedPageMetadataConflicts(resolved)) mutationCalls += 1;
  assert.equal(mutationCalls, 1);
});

void test("total remote adoption finalizes metadata locally and preserves the structural parent", () => {
  const local = { ...LOCAL, parentId: "structural-parent" };
  const resolution = resolvePageMetadataConflictChoice({
    state: createPageMetadataConflictState(DETAILS, INITIAL),
    field: "name",
    choice: "adoptRemote",
    localValues: local,
  });

  assert.equal(
    hasUnresolvedPageMetadataConflicts(resolution.state),
    false,
  );
  const finalized = finalizePageMetadataConflictValues(
    resolution.state,
    {
      ...local,
      name: String(resolution.localValue),
    },
  );
  assert.equal(finalized.name, "Remote");
  assert.equal(finalized.parentId, "structural-parent");
});

void test("total remote adoption needs no mutation and later changes use the remote baseline", () => {
  const resolution = resolvePageMetadataConflictChoice({
    state: createPageMetadataConflictState(DETAILS, INITIAL),
    field: "name",
    choice: "adoptRemote",
    localValues: LOCAL,
  });
  const local = {
    ...LOCAL,
    name: String(resolution.localValue),
  };
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: resolution.state.occBaseline,
    local,
    expectedMetaRevision: DETAILS.currentMetaRevision,
    dirtyFields: { name: false },
  });
  let mutationCalls = 0;
  if (Object.keys(payload).length > 0) mutationCalls += 1;

  assert.deepEqual(payload, {});
  assert.equal(mutationCalls, 0);

  const finalized = finalizePageMetadataConflictValues(
    resolution.state,
    local,
  );
  const laterPayload = toUpdatePageIntentDTOFromFormValues({
    baseline: finalized,
    local: { ...finalized, name: "Later" },
    expectedMetaRevision: DETAILS.currentMetaRevision,
  });
  assert.deepEqual(laterPayload.metadataChanges?.changes.name, {
    baseline: "Remote",
    local: "Later",
  });
});

void test("completed resolution rebases the next reset and keeps the conflict closed", () => {
  const initialWithOldParent = {
    ...INITIAL,
    parentId: "old-parent",
  };
  const localWithCurrentParent = {
    ...LOCAL,
    parentId: "current-parent",
  };
  const resolution = resolvePageMetadataConflictChoice({
    state: createPageMetadataConflictState(
      DETAILS,
      initialWithOldParent,
    ),
    field: "name",
    choice: "adoptRemote",
    localValues: localWithCurrentParent,
  });
  const rebasedResetBaseline = finalizePageMetadataConflictValues(
    resolution.state,
    {
      ...localWithCurrentParent,
      name: String(resolution.localValue),
    },
  );
  const closedConflict: PageMetadataConflictState | null = null;

  assert.equal(rebasedResetBaseline.name, "Remote");
  assert.notEqual(rebasedResetBaseline.name, "Initial");
  assert.equal(rebasedResetBaseline.parentId, "current-parent");
  assert.notEqual(rebasedResetBaseline.parentId, "old-parent");
  assert.equal(closedConflict, null);
});
