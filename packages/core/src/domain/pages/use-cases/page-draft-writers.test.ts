/**
 * @file packages/core/src/domain/pages/use-cases/page-draft-writers.test.ts
 * @layer core/domain/pages/use-cases
 * @description Verifies interactive structure writes use only the OCC transaction port.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { DraftPageStructureTransaction } from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { reorderPageChildren } from "@compoz/core/domain/pages/use-cases/reorder-page-children";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";

const NOW = "2026-07-29T10:00:00.000Z";
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
      },
    ],
    updatedAt: NOW,
  },
  draftStructureRevision: 4,
} as const;

function pagesRepository(
  page: Page = PAGE,
  overrides: Partial<PagesRepository> = {},
): PagesRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => page,
    readByIdWithRevisions: async () => ({
      page,
      revisions: { metaRevision: 2, blocksRevision: 3 },
    }),
    readBySlug: async () => null,
    readManyById: async (_state, ids) =>
      ids.map((id) => (id === page.id ? page : null)),
    updateDraftPageMetadata: async () => undefined,
    updateDraftPageBlocks: async () => undefined,
    existsById: async () => true,
    existsBySlug: async () => false,
    ...overrides,
  };
}

function structureTransaction(
  overrides: Partial<DraftPageStructureTransaction> = {},
): DraftPageStructureTransaction {
  return {
    create: async ({ page }) => ({ ...SNAPSHOT, page }),
    reorder: async () => SNAPSHOT,
    update: async () => ({ ...SNAPSHOT, page: PAGE }),
    delete: async () => SNAPSHOT,
    ...overrides,
  };
}

void test("update transaction type requires OCC whenever parentPageId is present", () => {
  const accepts = (
    _command: Parameters<DraftPageStructureTransaction["update"]>[0],
  ) => undefined;

  accepts({ pageId: PAGE.id });
  accepts({
    pageId: PAGE.id,
    parentPageId: null,
    expectedDraftStructureRevision: 4,
  });
  // @ts-expect-error A parent mutation cannot be constructed without OCC.
  accepts({ pageId: PAGE.id, parentPageId: null });
});

void test("createPage sends the required revision and initial metadata through the structure transaction", async () => {
  const commands: Parameters<DraftPageStructureTransaction["create"]>[0][] =
    [];
  const structure = structureTransaction({
    create: async (input) => {
      commands.push(input);
      return { ...SNAPSHOT, page: input.page };
    },
  });

  const result = await createPage({
    pages: pagesRepository(),
    structure,
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
  assert.deepEqual(commands[0]?.page.blocks, []);
  assert.equal(result.draftStructureRevision, 4);
});

void test("reorderPageChildren forwards even an empty permutation to transactional validation", async () => {
  let command: Parameters<DraftPageStructureTransaction["reorder"]>[0] | null =
    null;
  const result = await reorderPageChildren({
    structure: structureTransaction({
      reorder: async (input) => {
        command = input;
        return SNAPSHOT;
      },
    }),
  })({
    parentId: "parent",
    childIds: [],
    expectedDraftStructureRevision: 4,
  });

  assert.deepEqual(command, {
    parentPageId: "parent",
    orderedPageIds: [],
    expectedDraftStructureRevision: 4,
  });
  assert.equal(result.draftStructureRevision, 4);
});

void test("updatePage routes a parent and metadata patch through one structure command", async () => {
  const commands: Parameters<DraftPageStructureTransaction["update"]>[0][] =
    [];
  const parented = { ...PAGE, parentId: "parent-a" };
  const pages = pagesRepository(parented, {
    updateDraftPageMetadata: async () => {
      assert.fail("metadata must not be written outside the structure transaction");
    },
  });
  const structure = structureTransaction({
    update: async (input) => {
      commands.push(input);
      return {
        ...SNAPSHOT,
        page: {
          ...input.metadata!.page,
          parentId: input.parentPageId ?? parented.parentId,
        },
      };
    },
  });

  const result = await updatePage({
    pages,
    structure,
    nowIso: () => NOW,
  })({
    pageId: PAGE.id,
    parentId: null,
    name: "Renamed",
    expectedDraftStructureRevision: 4,
  });

  assert.equal(commands[0]?.parentPageId, null);
  assert.equal(commands[0]?.expectedDraftStructureRevision, 4);
  assert.equal(commands[0]?.metadata?.page.name, "Renamed");
  assert.equal(commands[0]?.metadata?.metaRevision, 2);
  assert.equal(result.structure?.draftStructureRevision, 4);
});

void test("updatePage parent no-op still checks OCC and returns the current snapshot", async () => {
  let calls = 0;
  const result = await updatePage({
    pages: pagesRepository(),
    structure: structureTransaction({
      update: async (command) => {
        calls += 1;
        assert.equal(command.parentPageId, null);
        assert.equal(command.expectedDraftStructureRevision, 4);
        return { ...SNAPSHOT, page: PAGE };
      },
    }),
  })({
    pageId: PAGE.id,
    parentId: null,
    expectedDraftStructureRevision: 4,
  });

  assert.equal(calls, 1);
  assert.equal(result.structure?.draftStructureRevision, 4);
});

void test("metadata-only update remains atomic in the structure transaction without requiring structure OCC", async () => {
  let metadataWrites = 0;
  let structureWrites = 0;
  const result = await updatePage({
    pages: pagesRepository(PAGE, {
      updateDraftPageMetadata: async (input) => {
        metadataWrites += 1;
        assert.equal(input.name, "Renamed");
      },
    }),
    structure: structureTransaction({
      update: async (command) => {
        structureWrites += 1;
        assert.equal(command.parentPageId, undefined);
        assert.equal(command.expectedDraftStructureRevision, undefined);
        assert.equal(command.metadata?.page.name, "Renamed");
        return { ...SNAPSHOT, page: command.metadata.page };
      },
    }),
    nowIso: () => NOW,
  })({ pageId: PAGE.id, name: "Renamed" });

  assert.equal(metadataWrites, 0);
  assert.equal(structureWrites, 1);
  assert.equal(result.page.name, "Renamed");
});

void test("slug rename carries only the known menu revisions", async () => {
  let command:
    | Parameters<DraftPageStructureTransaction["update"]>[0]
    | undefined;
  await updatePage({
    pages: pagesRepository(),
    structure: structureTransaction({
      update: async (input) => {
        command = input;
        return { ...SNAPSHOT, page: input.metadata!.page };
      },
    }),
  })({
    pageId: PAGE.id,
    slug: "renamed",
    expectedPrimaryMenuRevision: 7,
    expectedLegalMenuRevision: 9,
  });

  assert.deepEqual(command?.menuRenameExpectedRevisions, {
    expectedPrimaryMenuRevision: 7,
    expectedLegalMenuRevision: 9,
  });
});

for (const [name, patch] of [
  ["identical name", { name: PAGE.name }],
  ["normalized identical slug", { slug: "/page-a/" }],
] as const) {
  void test(`metadata ${name} returns the locked current snapshot without a write command`, async () => {
    let command:
      | Parameters<DraftPageStructureTransaction["update"]>[0]
      | undefined;
    const result = await updatePage({
      pages: pagesRepository(),
      structure: structureTransaction({
        update: async (input) => {
          command = input;
          return { ...SNAPSHOT, page: PAGE };
        },
      }),
    })({ pageId: PAGE.id, ...patch });

    assert.deepEqual(command, { pageId: PAGE.id });
    assert.strictEqual(result.page, PAGE);
    assert.strictEqual(result.structure.index, SNAPSHOT.index);
    assert.equal(result.structure.draftStructureRevision, 4);
  });
}

for (const parentPatch of [
  {},
  { parentId: "parent-a", expectedDraftStructureRevision: 4 },
  { parentId: "parent-b", expectedDraftStructureRevision: 4 },
] as const) {
  void test(`a child cannot become home with parent patch ${JSON.stringify(parentPatch)}`, async () => {
    let structureWrites = 0;
    const child = { ...PAGE, parentId: "parent-a" };
    await assert.rejects(
      () =>
        updatePage({
          pages: pagesRepository(child),
          structure: structureTransaction({
            update: async () => {
              structureWrites += 1;
              return { ...SNAPSHOT, page: child };
            },
          }),
        })({
          pageId: child.id,
          slug: "/",
          ...parentPatch,
        }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "PAGE_PARENT_INVALID",
    );
    assert.equal(structureWrites, 0);
  });
}

void test("root pagination is normalized to false in metadata-only patches", async () => {
  const root = { ...PAGE, paginationEnabled: false };
  let command:
    | Parameters<DraftPageStructureTransaction["update"]>[0]
    | undefined;
  const result = await updatePage({
    pages: pagesRepository(root),
    structure: structureTransaction({
      update: async (input) => {
        command = input;
        return { ...SNAPSHOT, page: root };
      },
    }),
  })({
    pageId: root.id,
    paginationEnabled: true,
  });

  assert.deepEqual(command, { pageId: root.id });
  assert.equal(result.page.paginationEnabled, false);
  assert.equal(result.structure.draftStructureRevision, 4);
});

void test("deletePage uses the structure transaction and is no longer idempotent", async () => {
  let command: Parameters<DraftPageStructureTransaction["delete"]>[0] | null =
    null;
  const result = await deletePage({
    structure: structureTransaction({
      delete: async (input) => {
        command = input;
        return SNAPSHOT;
      },
    }),
  })({
    pageId: PAGE.id,
    expectedDraftStructureRevision: 3,
  });

  assert.deepEqual(command, {
    pageId: PAGE.id,
    expectedDraftStructureRevision: 3,
  });
  assert.equal(result.index.pages.length, 1);
});

void test("structure use cases reject a missing revision with REVISION_REQUIRED", async () => {
  await assert.rejects(
    () =>
      deletePage({ structure: structureTransaction() })({
        pageId: PAGE.id,
        expectedDraftStructureRevision: undefined as unknown as number,
      }),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "REVISION_REQUIRED",
  );
});
