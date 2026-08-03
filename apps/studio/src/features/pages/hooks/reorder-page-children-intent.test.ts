/**
 * @file apps/studio/src/features/pages/hooks/reorder-page-children-intent.test.ts
 * @layer studio/features/pages/hooks
 * @description Verifies child reorder variables share one pre-optimistic snapshot.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

void test("page reorder conflicts adopt the saved snapshot and show the dedicated toast without a panel", () => {
  const source = readFileSync(new URL("./useReorderPageChildren.ts", import.meta.url), "utf8");
  const adoption = source.indexOf("adoptDraftStructureConflict(");
  const toast = source.indexOf("notify.error(");

  assert.ok(adoption >= 0);
  assert.ok(toast > adoption);
  assert.match(source, /studio\.pageForm\.reorderConflict\.title/u);
  assert.match(source, /studio\.pageForm\.reorderConflict\.description/u);
  assert.match(source, /if \(adopted\) \{[\s\S]*notify\.error\([\s\S]*return;/u);
  assert.doesNotMatch(source, /setConflict|ConflictPanel/u);

  const fr = JSON.parse(readFileSync(new URL("../../../i18n/messages/fr.json", import.meta.url), "utf8")) as { studio: { pageForm: { reorderConflict: { title: string; description: string } } } };
  const en = JSON.parse(readFileSync(new URL("../../../i18n/messages/en.json", import.meta.url), "utf8")) as typeof fr;
  assert.deepEqual(fr.studio.pageForm.reorderConflict, {
    title: "L’ordre des pages a été modifié",
    description: "Un autre déplacement a été enregistré avant le vôtre. L’ordre le plus récent a été chargé. Recommencez votre déplacement.",
  });
  assert.deepEqual(en.studio.pageForm.reorderConflict, {
    title: "Page order was changed",
    description: "Another move was saved before yours. The latest order has been loaded. Repeat your move.",
  });
});
