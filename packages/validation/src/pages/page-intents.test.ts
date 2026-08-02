/**
 * @file packages/validation/src/pages/page-intents.test.ts
 * @layer validation/pages
 * @description Boundary tests for revisioned page metadata and structure intents.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  CreatePageIntentSchema,
  DeletePageIntentSchema,
  ReorderChildrenIntentSchema,
  UpdatePageIntentSchema,
} from "@compoz/validation/pages/page-intents";

const CREATE = {
  name: "Page",
  seoTitle: null,
  seoDescription: null,
  parentId: null,
  sitemap: null,
  paginationEnabled: false,
  expectedDraftStructureRevision: 0,
};

void test("create, reorder and delete retain their structure preconditions", () => {
  assert.equal(CreatePageIntentSchema.safeParse(CREATE).success, true);
  assert.equal(
    ReorderChildrenIntentSchema.safeParse({
      baselineOrder: [],
      localOrder: [],
      expectedDraftStructureRevision: 2,
    }).success,
    true,
  );
  assert.equal(
    DeletePageIntentSchema.safeParse({
      expectedDraftStructureRevision: 3,
    }).success,
    true,
  );
});

void test("reorder requires safe revisioned permutations", () => {
  const valid = {
    baselineOrder: ["a", "b"],
    localOrder: ["b", "a"],
    expectedDraftStructureRevision: 2,
  };
  assert.equal(ReorderChildrenIntentSchema.safeParse(valid).success, true);
  for (const invalid of [
    { ...valid, expectedDraftStructureRevision: -1 },
    { ...valid, expectedDraftStructureRevision: 1.5 },
    { ...valid, baselineOrder: ["a", "a"] },
    { ...valid, localOrder: ["b", "b"] },
    { ...valid, localOrder: ["a", "c"] },
  ]) {
    assert.equal(ReorderChildrenIntentSchema.safeParse(invalid).success, false);
  }
  assert.equal(
    ReorderChildrenIntentSchema.safeParse({
      baselineOrder: ["a"],
      localOrder: ["a"],
    }).success,
    false,
  );
});

void test("metadata changes require their own revision and baseline/local pair", () => {
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      metadataChanges: {
        expectedMetaRevision: 4,
        changes: {
          name: { baseline: "Page", local: "Renamed" },
          sitemap: {
            baseline: null,
            local: {
              include: true,
              changefreq: null,
              priority: null,
            },
          },
        },
      },
    }).success,
    true,
  );
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      metadataChanges: {
        changes: {
          name: { baseline: "Page", local: "Renamed" },
        },
      },
    }).success,
    false,
  );
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      metadataChanges: {
        expectedMetaRevision: 4,
        changes: { name: { local: "Renamed" } },
      },
    }).success,
    false,
  );
});

void test("metadata allowlist rejects parent and unknown fields", () => {
  for (const invalidChanges of [
    { parentPageId: { baseline: null, local: "parent" } },
    { parentId: { baseline: null, local: "parent" } },
    { blocks: { baseline: [], local: [] } },
  ]) {
    assert.equal(
      UpdatePageIntentSchema.safeParse({
        metadataChanges: {
          expectedMetaRevision: 4,
          changes: invalidChanges,
        },
      }).success,
      false,
    );
  }
});

void test("parent change is independent and requires structure OCC", () => {
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      parentChange: {
        baseline: null,
        local: "parent",
        expectedDraftStructureRevision: 5,
      },
    }).success,
    true,
  );
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      parentChange: { baseline: null, local: "parent" },
    }).success,
    false,
  );
  assert.equal(UpdatePageIntentSchema.safeParse({}).success, true);
});
