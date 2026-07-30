/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.test.ts
 * @layer studio/features/pages/blocks/cache
 * @description Verifies that block mutations patch blocks without replacing page metadata.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import type {
  PageDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

function page(name: string, blockId: string): PageDTO {
  return {
    id: "page",
    parentId: "parent",
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    seoTitle: `${name} title`,
    seoDescription: `${name} description`,
    blocks: [
      {
        id: blockId,
        type: "section",
        name: blockId,
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      },
    ],
    sitemap: {
      include: true,
      priority: 0.7,
      changefreq: "weekly",
    },
    paginationEnabled: true,
    meta: {
      createdAt: "2026-07-29T10:00:00.000Z",
      updatedAt: "2026-07-29T10:00:00.000Z",
    },
  };
}

void test("a block mutation patches only blocks in an existing revisioned page", () => {
  const queryClient = new QueryClient();
  const current: PageWithRevisionsDTO = {
    page: page("Current metadata", "old-block"),
    revisions: { metaRevision: 9, blocksRevision: 3 },
  };
  queryClient.setQueryData(
    pageByIdKey("website", "page", "draft"),
    current,
  );

  syncBlocksFromPageCache(
    queryClient,
    "website",
    "page",
    {
      ...page("Stale metadata", "new-block"),
      parentId: "stale-parent",
    },
    "draft",
  );

  const cached = queryClient.getQueryData<PageWithRevisionsDTO>(
    pageByIdKey("website", "page", "draft"),
  );
  assert.equal(cached?.page.blocks[0]?.id, "new-block");
  assert.equal(cached?.page.name, "Current metadata");
  assert.equal(cached?.page.slug, "current-metadata");
  assert.equal(cached?.page.parentId, "parent");
  assert.equal(cached?.page.seoTitle, "Current metadata title");
  assert.equal(cached?.page.paginationEnabled, true);
  assert.deepEqual(cached?.revisions, current.revisions);
});

void test("a block mutation does not invent a page snapshot when none is cached", () => {
  const queryClient = new QueryClient();

  syncBlocksFromPageCache(
    queryClient,
    "website",
    "page",
    page("Incoming", "new-block"),
    "draft",
  );

  assert.equal(
    queryClient.getQueryData(
      pageByIdKey("website", "page", "draft"),
    ),
    undefined,
  );
});
