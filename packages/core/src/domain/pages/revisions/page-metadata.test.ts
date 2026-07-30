/**
 * @file packages/core/src/domain/pages/revisions/page-metadata.test.ts
 * @layer core/domain/pages/revisions
 * @description Covers normalized three-way page metadata resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import { resolvePageMetadataChanges } from "@compoz/core/domain/pages/revisions/page-metadata";

const PAGE: Page = {
  id: "page",
  parentId: "parent",
  slug: "page",
  name: "Page",
  seoTitle: null,
  seoDescription: "Description",
  blocks: [],
  sitemap: { include: true, changefreq: "weekly", priority: 0.7 },
  paginationEnabled: true,
  meta: {
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
  },
};

void test("resolves local-only, server-only, same-change and no-op fields independently", () => {
  const result = resolvePageMetadataChanges({
    current: {
      ...PAGE,
      name: "Remote name",
      seoTitle: "Shared",
    },
    effectiveParentId: PAGE.parentId,
    changes: {
      name: { baseline: "Page", local: "Page" },
      slug: { baseline: "page", local: "local-slug" },
      seoTitle: { baseline: null, local: "Shared" },
      seoDescription: {
        baseline: "Description",
        local: "Description",
      },
    },
  });

  assert.deepEqual(result.patch, { slug: "local-slug" });
  assert.deepEqual(result.changedFields, ["slug"]);
  assert.deepEqual(result.conflicts, []);
});

void test("aggregates all contradictory fields without producing writes for them", () => {
  const result = resolvePageMetadataChanges({
    current: {
      ...PAGE,
      name: "Remote",
      slug: "remote",
    },
    effectiveParentId: PAGE.parentId,
    changes: {
      name: { baseline: "Page", local: "Local" },
      slug: { baseline: "page", local: "local" },
    },
  });

  assert.deepEqual(result.patch, {});
  assert.deepEqual(
    result.conflicts.map((conflict) => conflict.field),
    ["name", "slug"],
  );
});

void test("normalizes nullable text, slug, sitemap and pagination before comparison", () => {
  const result = resolvePageMetadataChanges({
    current: PAGE,
    effectiveParentId: null,
    changes: {
      name: { baseline: " Page ", local: " Renamed " },
      slug: { baseline: "/page/", local: "/renamed/" },
      seoTitle: { baseline: "", local: "  Title  " },
      seoDescription: {
        baseline: " Description ",
        local: "   ",
      },
      sitemap: {
        baseline: {
          include: true,
          changefreq: "weekly",
          priority: 0.7,
        },
        local: {
          priority: 0.7,
          changefreq: "weekly",
          include: true,
        },
      },
      paginationEnabled: { baseline: true, local: true },
    },
  });

  assert.deepEqual(result.patch, {
    name: "Renamed",
    slug: "renamed",
    seoTitle: "Title",
    seoDescription: null,
  });
  assert.equal(result.conflicts.length, 0);
});

for (const [field, current, baseline, local] of [
  ["name", "Remote", "Page", "Local"],
  ["slug", "remote", "page", "local"],
  ["seoTitle", "Remote", null, "Local"],
  ["seoDescription", "Remote", "Description", "Local"],
  [
    "sitemap",
    { include: false, changefreq: null, priority: null },
    PAGE.sitemap,
    { include: true, changefreq: "daily", priority: 0.5 },
  ],
  ["paginationEnabled", false, true, true],
] as const) {
  void test(`${field} detects a contradiction or server-only normalized state`, () => {
    const result = resolvePageMetadataChanges({
      current: { ...PAGE, [field]: current },
      effectiveParentId: PAGE.parentId,
      changes: {
        [field]: { baseline, local },
      },
    });

    if (field === "paginationEnabled") {
      assert.equal(result.conflicts.length, 0);
    } else {
      assert.equal(result.conflicts[0]?.field, field);
    }
  });
}
