/**
 * @file apps/studio/src/features/site-index/cache.test.ts
 * @layer studio/features/site-index
 * @description Verifies index and structure revision are cached atomically.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import {
  adoptDraftStructurePagePatch,
  adoptDraftStructurePagePatchCache,
  adoptDraftStructureSnapshot,
  adoptMonotoneDraftStructureRead,
  getDraftStructureCache,
  patchDraftStructureCache,
  rollbackDraftStructureReorder,
  setDraftStructureCache,
} from "@compoz/studio/features/site-index/cache";

void test("stores and replaces index plus revision as one snapshot", () => {
  const queryClient = new QueryClient();
  const first = {
    index: { pages: [], updatedAt: "2026-07-29T10:00:00.000Z" },
    draftStructureRevision: 2,
  };

  setDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    first,
  );
  patchDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    (previous) => ({
      index: {
        ...previous.index,
        pages: [
          { id: "page", slug: "page", name: "Page", parentId: null },
        ],
      },
      draftStructureRevision: 3,
    }),
  );

  assert.deepEqual(
    getDraftStructureCache(
      queryClient,
      "website-a",
      CONTENT_STATE.DRAFT,
    ),
    {
      index: {
        pages: [
          { id: "page", slug: "page", name: "Page", parentId: null },
        ],
        updatedAt: first.index.updatedAt,
      },
      draftStructureRevision: 3,
    },
  );
});

void test("an equal-revision GET cannot undo an optimistic reorder", () => {
  const optimistic = {
    index: {
      pages: [
        { id: "b", slug: "b", name: "B", parentId: "root" },
        { id: "a", slug: "a", name: "A", parentId: "root" },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  const staleRead = {
    index: {
      pages: [
        { id: "a", slug: "a", name: "A", parentId: "root" },
        { id: "b", slug: "b", name: "B", parentId: "root" },
      ],
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
    draftStructureRevision: 5,
  };

  assert.strictEqual(
    adoptMonotoneDraftStructureRead(optimistic, staleRead),
    optimistic,
  );
});

void test("an equal-revision GET cannot restore older metadata", () => {
  const current = {
    index: {
      pages: [
        { id: "a", slug: "new", name: "New", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  const stale = {
    index: {
      pages: [
        { id: "a", slug: "old", name: "Old", parentId: null },
      ],
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
    draftStructureRevision: 5,
  };

  assert.strictEqual(
    adoptMonotoneDraftStructureRead(current, stale),
    current,
  );
});

void test("snapshot adoption ignores lower revisions and fully adopts higher revisions", () => {
  const current = {
    index: {
      pages: [
        { id: "current", slug: "current", name: "Current", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  const older = {
    index: { pages: [], updatedAt: "2026-07-29T10:00:00.000Z" },
    draftStructureRevision: 4,
  };
  const newer = {
    index: {
      pages: [
        { id: "newer", slug: "newer", name: "Newer", parentId: null },
      ],
      updatedAt: "2026-07-29T13:00:00.000Z",
    },
    draftStructureRevision: 6,
  };

  assert.strictEqual(adoptDraftStructureSnapshot(current, older), current);
  assert.strictEqual(adoptDraftStructureSnapshot(current, newer), newer);
});

void test("page PATCH adoption ignores the entire response when its structure revision is lower", () => {
  const current = {
    index: {
      pages: [
        { id: "page", slug: "current", name: "Current", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 6,
  };
  const older = {
    index: {
      pages: [
        { id: "page", slug: "older", name: "Older", parentId: null },
      ],
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
    draftStructureRevision: 5,
  };

  assert.strictEqual(
    adoptDraftStructurePagePatch(current, older, older.index.pages[0]!),
    current,
  );
});

void test("page PATCH adoption replaces the full snapshot when its structure revision is higher", () => {
  const current = {
    index: {
      pages: [
        { id: "old", slug: "old", name: "Old", parentId: null },
      ],
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  const page = {
    id: "new",
    slug: "new",
    name: "New",
    parentId: null,
  };
  const newer = {
    index: {
      pages: [page],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 6,
  };

  const adopted = adoptDraftStructurePagePatch(current, newer, page);
  assert.equal(adopted.draftStructureRevision, 6);
  assert.deepEqual(adopted.index.pages.map((item) => item.id), ["new"]);
});

void test("an older structure response cannot lower the cached revision", () => {
  const queryClient = new QueryClient();
  const current = {
    index: {
      pages: [
        { id: "current", slug: "current", name: "Current", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 6,
  };
  setDraftStructureCache(queryClient, "website-a", CONTENT_STATE.DRAFT, current);
  setDraftStructureCache(queryClient, "website-a", CONTENT_STATE.DRAFT, {
    index: { pages: [], updatedAt: "2026-07-29T11:00:00.000Z" },
    draftStructureRevision: 5,
  });

  assert.strictEqual(
    getDraftStructureCache(queryClient, "website-a", CONTENT_STATE.DRAFT),
    current,
  );
});

void test("late metadata patches update an existing reference without changing order or revision", () => {
  const queryClient = new QueryClient();
  const snapshot = {
    index: {
      pages: [
        { id: "a", slug: "a", name: "A", parentId: null },
        { id: "b", slug: "b", name: "B", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 6,
  };
  setDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    snapshot,
  );

  adoptDraftStructurePagePatchCache(
    queryClient,
    "website-a",
    snapshot,
    { id: "a", slug: "renamed", name: "Renamed", parentId: null },
    CONTENT_STATE.DRAFT,
  );

  const current = getDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
  );
  assert.equal(current?.draftStructureRevision, 6);
  assert.deepEqual(current?.index.pages.map((page) => page.id), ["a", "b"]);
  assert.equal(current?.index.pages[0]?.slug, "renamed");
});

void test("an equal-revision PATCH snapshot cannot regress order before its targeted page patch", () => {
  const queryClient = new QueryClient();
  const current = {
    index: {
      pages: [
        { id: "b", slug: "b", name: "B current", parentId: null },
        { id: "a", slug: "a", name: "A current", parentId: null },
      ],
      updatedAt: "2026-07-29T12:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  setDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    current,
  );
  setDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    {
      index: {
        pages: [
          { id: "a", slug: "a", name: "A stale", parentId: null },
          { id: "b", slug: "b", name: "B stale", parentId: null },
        ],
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
      draftStructureRevision: 5,
    },
  );
  adoptDraftStructurePagePatchCache(
    queryClient,
    "website-a",
    {
      index: {
        pages: [
          { id: "a", slug: "a", name: "A stale", parentId: null },
          { id: "b", slug: "b", name: "B stale", parentId: null },
        ],
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
      draftStructureRevision: 5,
    },
    { id: "a", slug: "a-new", name: "A new", parentId: null },
    CONTENT_STATE.DRAFT,
  );

  const adopted = getDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
  );
  assert.deepEqual(adopted?.index.pages.map((page) => page.id), ["b", "a"]);
  assert.equal(adopted?.index.pages[0]?.name, "B current");
  assert.equal(adopted?.index.pages[1]?.name, "A new");
  assert.equal(adopted?.draftStructureRevision, 5);
});

void test("late metadata patches never recreate a deleted page", () => {
  const queryClient = new QueryClient();
  const snapshot = {
    index: { pages: [], updatedAt: "2026-07-29T12:00:00.000Z" },
    draftStructureRevision: 6,
  };
  setDraftStructureCache(
    queryClient,
    "website-a",
    CONTENT_STATE.DRAFT,
    snapshot,
  );
  adoptDraftStructurePagePatchCache(
    queryClient,
    "website-a",
    snapshot,
    { id: "deleted", slug: "deleted", name: "Deleted", parentId: null },
    CONTENT_STATE.DRAFT,
  );
  assert.deepEqual(
    getDraftStructureCache(queryClient, "website-a", CONTENT_STATE.DRAFT)
      ?.index.pages,
    [],
  );
});

function reorderContext() {
  const before = {
    index: {
      pages: [
        { id: "a", slug: "a", name: "A", parentId: "parent" },
        { id: "b", slug: "b", name: "B", parentId: "parent" },
        { id: "other", slug: "other", name: "Other", parentId: null },
      ],
      updatedAt: "2026-07-29T10:00:00.000Z",
    },
    draftStructureRevision: 5,
  };
  const optimistic = {
    ...before,
    index: {
      ...before.index,
      pages: [
        before.index.pages[1]!,
        before.index.pages[0]!,
        before.index.pages[2]!,
      ],
    },
  };

  return {
    before,
    optimistic,
    parentPageId: "parent",
    orderedPageIdsBefore: ["a", "b"],
    orderedPageIdsOptimistic: ["b", "a"],
  } as const;
}

void test("reorder rollback restores only sibling order while preserving newer metadata", () => {
  const context = reorderContext();
  const current = {
    ...context.optimistic,
    index: {
      ...context.optimistic.index,
      pages: context.optimistic.index.pages.map((page) =>
        page.id === "a" ? { ...page, name: "A renamed" } : page,
      ),
    },
  };

  const rolledBack = rollbackDraftStructureReorder(current, context);

  assert.deepEqual(
    rolledBack.index.pages.map((page) => page.id),
    ["a", "b", "other"],
  );
  assert.equal(rolledBack.index.pages[0]?.name, "A renamed");
  assert.strictEqual(rolledBack.index.pages[2], current.index.pages[2]);
});

void test("reorder rollback never recreates a concurrently deleted page", () => {
  const context = reorderContext();
  const current = {
    ...context.optimistic,
    index: {
      ...context.optimistic.index,
      pages: context.optimistic.index.pages.filter(
        (page) => page.id !== "a",
      ),
    },
  };

  const rolledBack = rollbackDraftStructureReorder(current, context);

  assert.deepEqual(
    rolledBack.index.pages.map((page) => page.id),
    ["b", "other"],
  );
});

void test("reorder rollback ignores a newer revision", () => {
  const context = reorderContext();
  const current = {
    ...context.optimistic,
    draftStructureRevision: 6,
  };

  assert.strictEqual(
    rollbackDraftStructureReorder(current, context),
    current,
  );
});

void test("reorder rollback ignores a cache whose sibling order is no longer optimistic", () => {
  const context = reorderContext();
  const current = {
    ...context.optimistic,
    index: {
      ...context.optimistic.index,
      pages: [
        context.optimistic.index.pages[1]!,
        context.optimistic.index.pages[0]!,
        context.optimistic.index.pages[2]!,
      ],
    },
  };

  assert.strictEqual(
    rollbackDraftStructureReorder(current, context),
    current,
  );
});
