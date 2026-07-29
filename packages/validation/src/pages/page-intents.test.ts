/**
 * @file packages/validation/src/pages/page-intents.test.ts
 * @layer validation/pages
 * @description Boundary tests for revisioned page structure intents.
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

void test("create requires a non-negative integer structure revision", () => {
  assert.equal(CreatePageIntentSchema.safeParse(CREATE).success, true);
  const { expectedDraftStructureRevision: _revision, ...missing } = CREATE;
  assert.equal(CreatePageIntentSchema.safeParse(missing).success, false);

  for (const value of [-1, 1.5, "1", null]) {
    assert.equal(
      CreatePageIntentSchema.safeParse({
        ...CREATE,
        expectedDraftStructureRevision: value,
      }).success,
      false,
    );
  }
});

void test("reorder accepts empty permutations but requires the revision", () => {
  assert.equal(
    ReorderChildrenIntentSchema.safeParse({
      childIds: [],
      expectedDraftStructureRevision: 2,
    }).success,
    true,
  );
  assert.equal(
    ReorderChildrenIntentSchema.safeParse({ childIds: [] }).success,
    false,
  );
});

void test("delete requires the structure revision", () => {
  assert.equal(
    DeletePageIntentSchema.safeParse({
      expectedDraftStructureRevision: 3,
    }).success,
    true,
  );
  assert.equal(DeletePageIntentSchema.safeParse({}).success, false);
});

void test("PATCH revision is accepted only as a valid integer and remains optional for metadata-only patches", () => {
  assert.equal(UpdatePageIntentSchema.safeParse({ name: "Renamed" }).success, true);
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      parentId: null,
      expectedDraftStructureRevision: 4,
    }).success,
    true,
  );
  assert.equal(
    UpdatePageIntentSchema.safeParse({
      parentId: null,
      expectedDraftStructureRevision: -1,
    }).success,
    false,
  );
});
