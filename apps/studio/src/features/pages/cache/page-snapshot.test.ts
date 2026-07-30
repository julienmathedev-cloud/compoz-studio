/**
 * @file apps/studio/src/features/pages/cache/page-snapshot.test.ts
 * @layer studio/features/pages/cache
 * @description Verifies metadata-only page cache merges and structural parent resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import {
  adoptPageMetadataSnapshot,
  mergePageRevisionedSnapshot,
  patchPageStructureParent,
  resolvePageStructureParent,
} from "@compoz/studio/features/pages/cache/page-snapshot";

function snapshot(
  name: string,
  blockId: string,
  metaRevision: number,
  blocksRevision: number,
): PageWithRevisionsDTO {
  const timestamp = `2026-07-29T10:00:0${Math.max(metaRevision, blocksRevision)}.000Z`;
  return {
    page: {
      id: "page",
      parentId: null,
      slug: name.toLowerCase(),
      name,
      seoTitle: null,
      seoDescription: null,
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
      sitemap: null,
      paginationEnabled: false,
      meta: { createdAt: timestamp, updatedAt: timestamp },
    },
    revisions: { metaRevision, blocksRevision },
  };
}

void test("an initial read adopts the complete incoming snapshot", () => {
  const incoming = snapshot("Initial", "initial-block", 2, 7);

  assert.strictEqual(
    mergePageRevisionedSnapshot(undefined, incoming),
    incoming,
  );
});

void test("newer metadata is adopted without replacing cached blocks or their revision", () => {
  const current = snapshot("Old", "new-block", 2, 7);
  const incoming = snapshot("New", "incoming-block", 3, 99);
  const merged = mergePageRevisionedSnapshot(current, incoming);

  assert.equal(merged.page.name, "New");
  assert.equal(merged.page.blocks[0]?.id, "new-block");
  assert.strictEqual(merged.page.blocks, current.page.blocks);
  assert.strictEqual(merged.page.meta, current.page.meta);
  assert.deepEqual(merged.revisions, {
    metaRevision: 3,
    blocksRevision: 7,
  });
});

void test("older and equal metadata revisions preserve the current snapshot", () => {
  const current = snapshot("Current", "current-block", 5, 5);
  assert.strictEqual(
    mergePageRevisionedSnapshot(
      current,
      snapshot("Stale", "incoming-block", 4, 99),
    ),
    current,
  );
  assert.strictEqual(
    mergePageRevisionedSnapshot(
      current,
      snapshot("Equal but different", "incoming-block", 5, 99),
    ),
    current,
  );
});

void test("metadata revision never arbitrates parentId or cached blocks", () => {
  const current = {
    ...snapshot("Current", "current-block", 5, 5),
    page: {
      ...snapshot("Current", "current-block", 5, 5).page,
      parentId: "current-parent",
    },
  };
  const newerMetadata = {
    ...snapshot("New metadata", "incoming-block", 6, 99),
    page: {
      ...snapshot("New metadata", "incoming-block", 6, 99).page,
      parentId: "stale-metadata-parent",
    },
  };
  const afterMetadata = mergePageRevisionedSnapshot(
    current,
    newerMetadata,
  );
  assert.equal(afterMetadata.page.name, "New metadata");
  assert.equal(afterMetadata.page.parentId, "current-parent");
  assert.equal(afterMetadata.page.blocks[0]?.id, "current-block");
  assert.equal(afterMetadata.revisions.blocksRevision, 5);
});

void test("only an explicit structure patch changes parentId and stale pages cannot regress it", () => {
  const current = snapshot("Current", "block", 5, 5);
  const moved = patchPageStructureParent(current, "new-parent");
  assert.equal(moved?.page.parentId, "new-parent");
  assert.deepEqual(moved?.revisions, current.revisions);

  const stale = {
    ...snapshot("Stale", "stale-block", 4, 4),
    page: {
      ...snapshot("Stale", "stale-block", 4, 4).page,
      parentId: "old-parent",
    },
  };
  assert.equal(
    mergePageRevisionedSnapshot(moved, stale).page.parentId,
    "new-parent",
  );
});

void test("explicit metadata adoption preserves cached blocks, blocks revision, and parent", () => {
  const current = {
    ...snapshot("Local", "local-block", 2, 9),
    page: {
      ...snapshot("Local", "local-block", 2, 9).page,
      parentId: "structural-parent",
    },
  };
  const remote = {
    ...snapshot("Remote", "remote-block", 3, 4),
    page: {
      ...snapshot("Remote", "remote-block", 3, 4).page,
      parentId: "stale-page-parent",
      seoTitle: "Remote SEO",
      seoDescription: "Remote description",
      sitemap: {
        include: true,
        priority: 0.8,
        changefreq: "weekly" as const,
      },
      paginationEnabled: true,
    },
  };

  const adopted = adoptPageMetadataSnapshot(current, remote);

  assert.equal(adopted.page.name, "Remote");
  assert.equal(adopted.page.slug, "remote");
  assert.equal(adopted.page.seoTitle, "Remote SEO");
  assert.equal(adopted.page.seoDescription, "Remote description");
  assert.deepEqual(adopted.page.sitemap, remote.page.sitemap);
  assert.equal(adopted.page.paginationEnabled, true);
  assert.equal(adopted.page.blocks[0]?.id, "local-block");
  assert.equal(adopted.page.parentId, "structural-parent");
  assert.deepEqual(adopted.revisions, {
    metaRevision: 3,
    blocksRevision: 9,
  });
});

void test("structure parent resolution preserves null and only falls back for undefined", () => {
  const pages = [
    { id: "root", parentId: null },
    { id: "child", parentId: "parent-b" },
  ];

  assert.equal(
    resolvePageStructureParent(pages, "root", "parent-a"),
    null,
  );
  assert.equal(
    resolvePageStructureParent(pages, "child", "parent-a"),
    "parent-b",
  );
  assert.equal(
    resolvePageStructureParent(undefined, "root", "parent-a"),
    "parent-a",
  );
  assert.equal(
    resolvePageStructureParent(pages, "missing", "parent-a"),
    "parent-a",
  );
  assert.equal(
    resolvePageStructureParent(undefined, "root", null),
    null,
  );
});
