/**
 * @file apps/studio/src/features/pages/cache/seed-created-page.test.ts
 * @layer studio/features/pages/cache
 * @description Verifies creation seeds a merge-safe revisioned page snapshot.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";

import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { mergePageRevisionedSnapshot } from "@compoz/studio/features/pages/cache/page-snapshot";
import { seedCreatedPageCache } from "@compoz/studio/features/pages/cache/seed-created-page";

const created: PageWithRevisionsDTO = {
  page: {
    id: "page-a",
    parentId: null,
    slug: "page-a",
    name: "Page A",
    seoTitle: null,
    seoDescription: null,
    blocks: [],
    meta: { createdAt: "2026-07-31T00:00:00.000Z", updatedAt: "2026-07-31T00:00:00.000Z" },
    sitemap: null,
    paginationEnabled: false,
  },
  revisions: { metaRevision: 0, blocksRevision: 0 },
};

void test("creation seed remains valid for an immediate monotone refetch merge", () => {
  const queryClient = new QueryClient();
  seedCreatedPageCache(queryClient, "website-a", "draft", created);
  const cached = queryClient.getQueryData<PageWithRevisionsDTO>(
    pageByIdKey("website-a", "page-a", "draft"),
  );

  const merged = mergePageRevisionedSnapshot(cached, {
    ...created,
    page: { ...created.page, name: "Refetched" },
    revisions: { metaRevision: 1, blocksRevision: 0 },
  });

  assert.deepEqual(merged.revisions, { metaRevision: 1, blocksRevision: 0 });
  assert.equal(merged.page.name, "Refetched");
});
