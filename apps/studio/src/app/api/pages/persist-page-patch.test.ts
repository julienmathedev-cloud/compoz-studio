/**
 * @file apps/studio/src/app/api/pages/persist-page-patch.test.ts
 * @layer studio/app/api
 * @description Verifies PATCH orchestration preserves atomic no-op snapshots and failures.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { DraftPageStructureTransaction } from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { persistPagePatch } from "@compoz/studio/app/api/pages/[pageId]/persist-page-patch";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

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
const SNAPSHOT = {
  index: {
    pages: [
      {
        id: PAGE.id,
        parentId: PAGE.parentId,
        slug: PAGE.slug,
        name: PAGE.name,
      },
    ],
    updatedAt: NOW,
  },
  draftStructureRevision: 6,
} as const;

function pages(): PagesRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => PAGE,
    readByIdWithRevisions: async () => ({
      page: PAGE,
      revisions: { metaRevision: 3, blocksRevision: 0 },
    }),
    readBySlug: async () => null,
    readManyById: async () => [PAGE],
    updateDraftPageMetadata: async () => {
      assert.fail("a no-op must not write page metadata");
    },
    updateDraftPageBlocks: async () => undefined,
    existsById: async () => true,
    existsBySlug: async () => false,
  };
}

function structure(
  update: DraftPageStructureTransaction["update"],
): DraftPageStructureTransaction {
  return {
    create: async ({ page }) => ({ ...SNAPSHOT, page }),
    reorder: async () => SNAPSHOT,
    update,
    delete: async () => SNAPSHOT,
  };
}

void test("an effective metadata no-op produces the complete HTTP 200 payload from the locked snapshot", async () => {
  const response = await handleRoute(
    "api.studio.pages.id.PATCH.test",
    new Request("http://localhost/api/pages/page", {
      method: "PATCH",
    }),
    async () =>
      persistPagePatch(
        {
          pages: pages(),
          structure: structure(async (command) => {
            assert.deepEqual(command, { pageId: PAGE.id });
            return { ...SNAPSHOT, page: PAGE };
          }),
        },
        { pageId: PAGE.id, name: ` ${PAGE.name} ` },
      ),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    page: PAGE,
    index: SNAPSHOT.index,
    draftStructureRevision: 6,
  });
});

void test("a technical no-op transaction failure remains rejected", async () => {
  const failure = new Error("transaction unavailable");

  await assert.rejects(
    () =>
      persistPagePatch(
        {
          pages: pages(),
          structure: structure(async () => {
            throw failure;
          }),
        },
        { pageId: PAGE.id, name: PAGE.name },
      ),
    failure,
  );
});
