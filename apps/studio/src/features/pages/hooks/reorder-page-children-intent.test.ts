/**
 * @file apps/studio/src/features/pages/hooks/reorder-page-children-intent.test.ts
 * @layer studio/features/pages/hooks
 * @description Verifies child reorder variables share one pre-optimistic snapshot.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { createReorderPageChildrenIntent } from "@compoz/studio/features/pages/hooks/reorder-page-children-intent";

void test("child reorder captures baseline and revision before optimistic order", () => {
  const snapshot = {
    index: {
      pages: [
        { id: "parent", parentId: null, slug: "parent", name: "Parent", metaRevision: 1 },
        { id: "a", parentId: "parent", slug: "a", name: "A", metaRevision: 1 },
        { id: "b", parentId: "parent", slug: "b", name: "B", metaRevision: 1 },
      ],
      updatedAt: "2026-08-02T00:00:00.000Z",
    },
    draftStructureRevision: 7,
  };
  const intent = createReorderPageChildrenIntent(snapshot, "parent", ["b", "a"]);
  assert.deepEqual(intent.baselineOrder, ["a", "b"]);
  assert.deepEqual(intent.localOrder, ["b", "a"]);
  assert.equal(intent.expectedDraftStructureRevision, 7);
});
