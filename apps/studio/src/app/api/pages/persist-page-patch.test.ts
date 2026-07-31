/**
 * @file apps/studio/src/app/api/pages/persist-page-patch.test.ts
 * @layer studio/app/api
 * @description Verifies PATCH response mapping preserves optional structure and revisions.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { DraftPageStructureTransaction } from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import { persistPagePatch } from "@compoz/studio/app/api/pages/[pageId]/persist-page-patch";

const NOW = "2026-07-29T10:00:00.000Z";
const PAGE: Page = {
  id: "page",
  parentId: null,
  slug: "page",
  name: "Page",
  seoTitle: null,
  seoDescription: null,
  blocks: [],
  sitemap: null,
  paginationEnabled: false,
  meta: { createdAt: NOW, updatedAt: NOW },
};
const REVISIONS = { metaRevision: 3, blocksRevision: 4 } as const;
const STRUCTURE = {
  index: {
    pages: [
      {
        id: PAGE.id,
        parentId: null,
        slug: PAGE.slug,
        name: PAGE.name,
        metaRevision: 3,
      },
    ],
    updatedAt: NOW,
  },
  draftStructureRevision: 6,
} as const;

function structure(
  update: DraftPageStructureTransaction["update"],
): DraftPageStructureTransaction {
  return {
    create: async ({ page }) => ({ ...STRUCTURE, page, revisions: REVISIONS }),
    reorder: async () => ({ ...STRUCTURE, outcome: "updated" }),
    update,
    delete: async () => STRUCTURE,
  };
}

void test("metadata-only response omits structure and includes both page revisions", async () => {
  const response = await persistPagePatch(
    {
      structure: structure(async (intent) => {
        assert.equal(intent.metadataChanges?.expectedMetaRevision, 3);
        return { outcome: "updated", slugChanged: false, page: PAGE, revisions: REVISIONS };
      }),
    },
    {
      pageId: PAGE.id,
      metadataChanges: {
        expectedMetaRevision: 3,
        changes: {
          name: { baseline: "Page", local: "Renamed" },
        },
      },
    },
  );

  assert.deepEqual(response, { outcome: "updated", slugChanged: false, page: PAGE, revisions: REVISIONS });
});

void test("a real parent change returns the structure snapshot atomically", async () => {
  const response = await persistPagePatch(
    {
      structure: structure(async () => ({
        outcome: "updated",
        slugChanged: false,
        page: PAGE,
        revisions: REVISIONS,
        structure: STRUCTURE,
      })),
    },
    {
      pageId: PAGE.id,
      parentChange: {
        baseline: "parent",
        local: null,
        expectedDraftStructureRevision: 5,
      },
    },
  );

  assert.deepEqual(response.structure, STRUCTURE);
});
