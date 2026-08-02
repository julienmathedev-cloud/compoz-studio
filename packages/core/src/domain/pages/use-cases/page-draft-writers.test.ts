/**
 * @file packages/core/src/domain/pages/use-cases/page-draft-writers.test.ts
 * @layer core/domain/pages/use-cases
 * @description Verifies interactive page writes use the OCC transaction ports.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { DraftPageStructureTransaction } from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { reorderPageChildren } from "@compoz/core/domain/pages/use-cases/reorder-page-children";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";

const NOW = "2026-07-29T10:00:00.000Z";
const REVISIONS = { metaRevision: 2, blocksRevision: 3 } as const;
const PAGE: Page = {
  id: "page-a",
  parentId: null,
  slug: "page-a",
  name: "Page A",
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
        metaRevision: REVISIONS.metaRevision,
      },
    ],
    updatedAt: NOW,
  },
  draftStructureRevision: 4,
} as const;

function pagesRepository(): PagesRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => PAGE,
    readByIdWithRevisions: async () => ({
      page: PAGE,
      revisions: REVISIONS,
    }),
    readBySlug: async () => null,
    readManyById: async (_state, ids) =>
      ids.map((id) => (id === PAGE.id ? PAGE : null)),
    readManySitemapMetadataById: async () => [],
    compareAndSetDraftPageBlocks: async () => true,
    existsById: async () => true,
    existsBySlug: async () => false,
  };
}

function structureTransaction(
  overrides: Partial<DraftPageStructureTransaction> = {},
): DraftPageStructureTransaction {
  return {
    create: async ({ page }) => ({ ...SNAPSHOT, page, revisions: REVISIONS }),
    reorder: async () => ({ ...SNAPSHOT, outcome: "updated" }),
    update: async () => ({ outcome: "noChanges", slugChanged: false, page: PAGE, revisions: REVISIONS }),
    delete: async () => SNAPSHOT,
    ...overrides,
  };
}

void test("update transaction type requires metadata and parent preconditions inside their intents", () => {
  const accepts = (
    _intent: Parameters<DraftPageStructureTransaction["update"]>[0],
  ) => undefined;

  accepts({ pageId: PAGE.id });
  accepts({
    pageId: PAGE.id,
    metadataChanges: { expectedMetaRevision: 2, changes: {} },
  });
  accepts({
    pageId: PAGE.id,
    parentChange: {
      baseline: null,
      local: "parent",
      expectedDraftStructureRevision: 4,
    },
  });
  // @ts-expect-error A metadata mutation cannot omit expectedMetaRevision.
  accepts({ pageId: PAGE.id, metadataChanges: { changes: {} } });
  // @ts-expect-error A parent mutation cannot omit structure OCC.
  accepts({ pageId: PAGE.id, parentChange: { baseline: null, local: "p" } });
});

void test("createPage sends the structure revision and initial page through the transaction", async () => {
  const commands: Parameters<DraftPageStructureTransaction["create"]>[0][] =
    [];
  const result = await createPage({
    pages: pagesRepository(),
    structure: structureTransaction({
      create: async (input) => {
        commands.push(input);
        return { ...SNAPSHOT, page: input.page, revisions: REVISIONS };
      },
    }),
    idGenerator: { nextId: () => "created-page" },
    nowIso: () => NOW,
  })({
    name: "Created page",
    slug: "created-page",
    seoTitle: null,
    seoDescription: null,
    parentId: null,
    sitemap: null,
    paginationEnabled: false,
    expectedDraftStructureRevision: 3,
  });

  assert.equal(commands[0]?.expectedDraftStructureRevision, 3);
  assert.equal(commands[0]?.page.meta.createdAt, NOW);
  assert.equal(result.draftStructureRevision, 4);
});

void test("reorder and delete keep using the structure transaction", async () => {
  let reorderIntent:
    | Parameters<DraftPageStructureTransaction["reorder"]>[0]
    | undefined;
  let deleteIntent:
    | Parameters<DraftPageStructureTransaction["delete"]>[0]
    | undefined;
  const structure = structureTransaction({
    reorder: async (input) => {
      reorderIntent = input;
      return { ...SNAPSHOT, outcome: "updated" };
    },
    delete: async (input) => {
      deleteIntent = input;
      return SNAPSHOT;
    },
  });

  await reorderPageChildren({ structure })({
    parentId: "parent",
    baselineOrder: [PAGE.id],
    localOrder: [PAGE.id],
    expectedDraftStructureRevision: 4,
  });
  await deletePage({ structure })({
    pageId: PAGE.id,
    expectedDraftStructureRevision: 4,
  });

  assert.equal(reorderIntent?.expectedDraftStructureRevision, 4);
  assert.deepEqual(reorderIntent?.baselineOrder, [PAGE.id]);
  assert.deepEqual(reorderIntent?.localOrder, [PAGE.id]);
  assert.equal(deleteIntent?.expectedDraftStructureRevision, 4);
});

void test("reorder rejects missing parent, revision, and non-permutation orders", async () => {
  const run = reorderPageChildren({ structure: structureTransaction() });
  for (const input of [
    { parentId: "", baselineOrder: [PAGE.id], localOrder: [PAGE.id], expectedDraftStructureRevision: 4 },
    { parentId: "parent", baselineOrder: [PAGE.id], localOrder: [PAGE.id], expectedDraftStructureRevision: undefined },
    { parentId: "parent", baselineOrder: [PAGE.id], localOrder: ["other"], expectedDraftStructureRevision: 4 },
  ]) {
    await assert.rejects(
      () => run(input as never),
      (error: unknown) => error instanceof DomainError,
    );
  }
});

void test("updatePage forwards one targeted composite intent without a repository read", async () => {
  let received:
    | Parameters<DraftPageStructureTransaction["update"]>[0]
    | undefined;
  const input = {
    pageId: PAGE.id,
    metadataChanges: {
      expectedMetaRevision: 2,
      changes: {
        name: { baseline: "Page A", local: "Renamed" },
      },
    },
    parentChange: {
      baseline: null,
      local: "parent",
      expectedDraftStructureRevision: 4,
    },
  } as const;

  const result = await updatePage({
    structure: structureTransaction({
      update: async (intent) => {
        received = intent;
        return {
          outcome: "updated",
          slugChanged: false,
          page: { ...PAGE, name: "Renamed", parentId: "parent" },
          revisions: { metaRevision: 3, blocksRevision: 3 },
          structure: SNAPSHOT,
        };
      },
    }),
  })(input);

  assert.deepEqual(received, input);
  assert.equal(result.revisions.metaRevision, 3);
  assert.equal(result.structure?.draftStructureRevision, 4);
});

void test("an empty update intent still returns the transaction's current revisioned page", async () => {
  const result = await updatePage({
    structure: structureTransaction(),
  })({ pageId: PAGE.id });

  assert.strictEqual(result.page, PAGE);
  assert.deepEqual(result.revisions, REVISIONS);
  assert.equal(result.structure, undefined);
});
