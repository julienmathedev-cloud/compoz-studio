/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests deferred page metadata conflict choices and three-way resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import {
  choosePageMetadataConflict,
  createPageMetadataConflictState,
  currentPageMetadataValues,
  hasCompletePageMetadataConflictChoices,
  keepLocalPageMetadataValues,
  resolvePageMetadataConflictValues,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const BASELINE: PageFormValues = {
  name: "Initial",
  slug: "initial",
  seoTitle: null,
  seoDescription: null,
  parentId: "old-parent",
  sitemap: null,
  paginationEnabled: false,
};
const LOCAL: PageFormValues = {
  ...BASELINE,
  name: "Local",
  slug: "local-only",
  parentId: "local-parent",
};
const DETAILS: PageMetadataConflictDetails = {
  expectedMetaRevision: 2,
  currentMetaRevision: 3,
  conflicts: [{
    field: "name",
    baseline: "Initial",
    local: "Local",
    current: "Remote",
  }],
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
      meta: {
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
    },
    revisions: { metaRevision: 3, blocksRevision: 4 },
  },
};

void test("choosing a radio records only server/local without mutating snapshots", () => {
  const state = createPageMetadataConflictState(DETAILS, BASELINE, LOCAL);
  const before = structuredClone(state);
  const choices = choosePageMetadataConflict({}, "name", "local");

  assert.deepEqual(choices, { name: "local" });
  assert.deepEqual(state, before);
  assert.equal(state.baseline.name, "Initial");
  assert.equal(state.local.name, "Local");
});

void test("requires every real conflict but resolves mergeable local-only metadata automatically", () => {
  const state = createPageMetadataConflictState(DETAILS, BASELINE, LOCAL);
  assert.equal(hasCompletePageMetadataConflictChoices(state, {}), false);

  const choices = choosePageMetadataConflict({}, "name", "server");
  assert.equal(hasCompletePageMetadataConflictChoices(state, choices), true);
  const resolution = resolvePageMetadataConflictValues({
    state,
    choices,
    localParentId: "selected-parent",
  });

  assert.equal(resolution.status, "resolved");
  if (resolution.status === "resolved") {
    assert.equal(resolution.values.name, "Remote");
    assert.equal(resolution.values.slug, "local-only");
    assert.equal(resolution.values.parentId, "selected-parent");
  }
});

void test("mixed server/local choices resolve from currentMetaRevision values", () => {
  const details: PageMetadataConflictDetails = {
    ...DETAILS,
    conflicts: [
      ...DETAILS.conflicts,
      { field: "slug", baseline: "initial", local: "local", current: "remote" },
    ],
    current: {
      ...DETAILS.current,
      page: { ...DETAILS.current.page, slug: "remote" },
    },
  };
  const state = createPageMetadataConflictState(
    details,
    BASELINE,
    { ...LOCAL, slug: "local" },
  );
  const resolution = resolvePageMetadataConflictValues({
    state,
    choices: { name: "server", slug: "local" },
    localParentId: "selected-parent",
  });

  assert.deepEqual(resolution, {
    status: "resolved",
    values: {
      ...currentPageMetadataValues(state, "selected-parent"),
      slug: "local",
    },
  });
});

void test("global current and local values both preserve the selected structural parent", () => {
  const state = createPageMetadataConflictState(DETAILS, BASELINE, LOCAL);

  assert.equal(currentPageMetadataValues(state, "selected-parent").parentId, "selected-parent");
  assert.equal(currentPageMetadataValues(state, "selected-parent").name, "Remote");
  assert.equal(keepLocalPageMetadataValues(state, "selected-parent").parentId, "selected-parent");
  assert.equal(keepLocalPageMetadataValues(state, "selected-parent").name, "Local");
});
