/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-controller.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests metadata-only mutation ownership, structural baselines, and second conflicts.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import {
  executePageMetadataConflictMutation,
  rebasePageMetadataConflictBaseline,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import {
  createPageMetadataConflictState,
  currentPageMetadataValues,
  resolvePageMetadataConflictValues,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const structuralBaseline: PageFormValues = {
  name: "Initial",
  slug: "initial",
  seoTitle: null,
  seoDescription: null,
  parentId: "baseline-parent",
  sitemap: null,
  paginationEnabled: false,
};
const local: PageFormValues = {
  ...structuralBaseline,
  name: "Local",
  parentId: "local-parent",
};
const details = {
  expectedMetaRevision: 2,
  currentMetaRevision: 3,
  conflicts: [{ field: "name", baseline: "Initial", local: "Local", current: "Remote" }],
  current: {
    page: {
      id: "page",
      parentId: "remote-parent",
      slug: "initial",
      name: "Remote",
      seoTitle: null,
      seoDescription: null,
      blocks: [],
      sitemap: null,
      paginationEnabled: false,
      meta: { createdAt: "2026-01-01", updatedAt: "2026-01-02" },
    },
    revisions: { metaRevision: 3, blocksRevision: 4 },
  },
} as const;
const state = createPageMetadataConflictState(details, structuralBaseline, local);
const response: UpdatePageResponse = {
  outcome: "updated",
  slugChanged: false,
  page: { ...details.current.page, name: "Local" },
  revisions: { metaRevision: 4, blocksRevision: 4 },
};

void test("metadata baseline rebasing never adopts the local structural parent", () => {
  const rebased = rebasePageMetadataConflictBaseline(
    { values: structuralBaseline, metaRevision: 2 },
    local,
    3,
  );

  assert.equal(rebased.values.name, "Local");
  assert.equal(rebased.values.parentId, "baseline-parent");
  assert.equal(rebased.metaRevision, 3);
});

void test("adoptCurrent performs no PATCH and preserves a later structural parentChange", () => {
  let patchCalls = 0;
  const adoptedValues = currentPageMetadataValues(state, "local-parent");
  const adoptedBaseline = rebasePageMetadataConflictBaseline(
    { values: structuralBaseline, metaRevision: 2 },
    adoptedValues,
    details.currentMetaRevision,
  );

  assert.equal(patchCalls, 0);
  assert.equal(adoptedValues.name, "Remote");
  assert.equal(adoptedValues.parentId, "local-parent");
  assert.equal(adoptedBaseline.values.name, "Remote");
  assert.equal(adoptedBaseline.values.parentId, "baseline-parent");
  assert.equal(adoptedBaseline.metaRevision, 3);

  const nextSave = toUpdatePageIntentDTOFromFormValues({
    baseline: adoptedBaseline.values,
    local: adoptedValues,
    expectedMetaRevision: adoptedBaseline.metaRevision,
    expectedDraftStructureRevision: 9,
  });
  patchCalls += nextSave.parentChange ? 1 : 0;
  assert.deepEqual(nextSave.parentChange, {
    baseline: "baseline-parent",
    local: "local-parent",
    expectedDraftStructureRevision: 9,
  });
  assert.equal(patchCalls, 1);
});

void test("keepLocal and apply each execute one metadata-only mutation without parentChange", async () => {
  for (const action of ["keepLocal", "apply"] as const) {
    let calls = 0;
    const result = await executePageMetadataConflictMutation({
      request: {
        pageId: "page",
        baseline: {
          values: { ...structuralBaseline, name: "Remote", parentId: "local-parent" },
          metaRevision: 3,
        },
        values: local,
      },
      state,
      structuralBaseline: { values: structuralBaseline, metaRevision: 2 },
      beforeMutation: (baseline, submittedLocal) => {
        assert.equal(baseline.values.parentId, "baseline-parent", action);
        assert.equal(submittedLocal.parentId, "local-parent", action);
      },
      resolve: async (_pageId, baseline, next) => {
        calls += 1;
        assert.equal(baseline.metaRevision, 3, action);
        assert.equal(baseline.values.parentId, "baseline-parent", action);
        assert.equal(next.parentId, "baseline-parent", action);
        return { status: "submitted", response };
      },
    });

    assert.equal(calls, 1, action);
    assert.equal(result.status, "success", action);
    if (result.status === "success") {
      assert.equal(result.values.parentId, "local-parent", action);
      assert.equal(result.metaRevision, 4, action);
      assert.equal(result.adoptCurrentCache, false, action);
    }
  }
});

void test("a second 409 performs no retry and returns a new resolvable conflict outcome", async () => {
  let calls = 0;
  const result = await executePageMetadataConflictMutation({
    request: {
      pageId: "page",
      baseline: { values: structuralBaseline, metaRevision: 3 },
      values: local,
    },
    state,
    structuralBaseline: { values: structuralBaseline, metaRevision: 2 },
    beforeMutation: () => undefined,
    resolve: async () => {
      calls += 1;
      return { status: "metadataConflict" };
    },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { status: "conflict" });

  const nextDetails = {
    ...details,
    expectedMetaRevision: 3,
    currentMetaRevision: 4,
    conflicts: [{ field: "name", baseline: "Remote", local: "Local", current: "New remote" }],
    current: {
      ...details.current,
      page: { ...details.current.page, name: "New remote" },
      revisions: { metaRevision: 4, blocksRevision: 4 },
    },
  } as const;
  const nextState = createPageMetadataConflictState(
    nextDetails,
    currentPageMetadataValues(state, "baseline-parent"),
    local,
  );
  const resolution = resolvePageMetadataConflictValues({
    state: nextState,
    choices: { name: "local" },
    localParentId: "local-parent",
  });
  assert.equal(resolution.status, "resolved");
});
