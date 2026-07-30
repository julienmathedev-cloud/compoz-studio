/**
 * @file apps/studio/src/features/pages/conflicts/page-structure-conflict.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests parent-only rebasing from a structure conflict snapshot.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { DraftStructureConflictDetails } from "@compoz/infra/lib/get-draft-structure-conflict-details";
import { rebasePageStructureConflictParent } from "@compoz/studio/features/pages/conflicts/page-structure-conflict";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const VALUES: PageFormValues = {
  name: "Local metadata",
  slug: "local-metadata",
  seoTitle: "Local SEO",
  seoDescription: "Local description",
  parentId: "parent-a",
  sitemap: {
    include: true,
    priority: 0.8,
    changefreq: "weekly",
  },
  paginationEnabled: true,
};

function details(
  parentId: string | null,
): DraftStructureConflictDetails {
  return {
    expectedDraftStructureRevision: 7,
    currentDraftStructureRevision: 8,
    current: {
      index: {
        pages: [
          {
            id: "page",
            slug: "server",
            name: "Server metadata",
            parentId,
            metaRevision: 99,
          },
        ],
        updatedAt: "2026-07-30T10:00:00.000Z",
      },
      draftStructureRevision: 8,
    },
  };
}

void test("root parent rebasing preserves every metadata baseline and meta revision", () => {
  const baseline = { values: VALUES, metaRevision: 4 };
  const rebase = rebasePageStructureConflictParent({
    baseline,
    details: details(null),
    pageId: "page",
  });

  assert.equal(rebase?.parentId, null);
  assert.equal(rebase?.baseline.values.parentId, null);
  assert.equal(rebase?.baseline.values.name, VALUES.name);
  assert.equal(rebase?.baseline.values.slug, VALUES.slug);
  assert.equal(rebase?.baseline.values.seoTitle, VALUES.seoTitle);
  assert.equal(
    rebase?.baseline.values.seoDescription,
    VALUES.seoDescription,
  );
  assert.deepEqual(rebase?.baseline.values.sitemap, VALUES.sitemap);
  assert.equal(
    rebase?.baseline.values.paginationEnabled,
    VALUES.paginationEnabled,
  );
  assert.equal(rebase?.baseline.metaRevision, 4);
});

void test("a non-null server parent is adopted without metadata rebasing", () => {
  const rebase = rebasePageStructureConflictParent({
    baseline: { values: VALUES, metaRevision: 4 },
    details: details("parent-c"),
    pageId: "page",
  });

  assert.equal(rebase?.parentId, "parent-c");
  assert.equal(rebase?.baseline.values.parentId, "parent-c");
  assert.equal(rebase?.baseline.values.name, "Local metadata");
  assert.equal(rebase?.baseline.metaRevision, 4);
});

void test("a page absent from the server snapshot cannot produce a parent rebase", () => {
  assert.equal(
    rebasePageStructureConflictParent({
      baseline: { values: VALUES, metaRevision: 4 },
      details: details(null),
      pageId: "missing",
    }),
    null,
  );
});
