/**
 * @file packages/core/src/domain/pages/use-cases/page-draft-writers.test.ts
 * @layer core/domain/pages/use-cases
 * @description Verifies that Page use cases call only their narrow draft writer.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  Page,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";
import type {
  CreateDraftPageInput,
  DetachDraftPageChildrenInput,
  PagesRepository,
  UpdateDraftPageBlocksInput,
  UpdateDraftPageMetadataInput,
  UpdateDraftPageParentInput,
} from "@compoz/core/domain/pages/ports/pages-repository";
import { createSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const UPDATED_AT = "2026-01-02T00:00:00.000Z";
const NEXT_UPDATED_AT = "2026-01-03T00:00:00.000Z";

const BLOCK_A: Block = {
  id: "block-a",
  type: "section",
  name: "Block A",
  containerMode: "contained",
  lcpPriority: false,
  rows: [],
};

const BLOCK_B: Block = {
  id: "block-b",
  type: "section",
  name: "Block B",
  containerMode: "fullBleed",
  lcpPriority: false,
  rows: [],
};

const PAGE: Page = {
  id: "page-id",
  parentId: "parent-id",
  slug: "page-slug",
  name: "Page name",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  blocks: [BLOCK_A, BLOCK_B],
  sitemap: {
    include: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  paginationEnabled: true,
  meta: {
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
};

const PAGE_READ: PageWithRevisions = {
  page: PAGE,
  revisions: {
    metaRevision: 19,
    blocksRevision: 29,
  },
};

function forbiddenWriter(name: string): () => Promise<never> {
  return async () => {
    throw new DomainError({
      code: ERROR_CODES.INVALID_ARGUMENT,
      message: `Foreign writer called: ${name}`,
    });
  };
}

function createPagesRepository(
  overrides: Partial<PagesRepository> = {},
): PagesRepository {
  return {
    ensureBase: async () => undefined,
    readById: async () => {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: "Legacy readById called",
      });
    },
    readByIdWithRevisions: async () => PAGE_READ,
    readBySlug: async () => null,
    readManyById: async (
      _state: ContentState,
      pageIds: ReadonlyArray<string>,
    ) => pageIds.map(() => null),
    createDraftPage: forbiddenWriter("createDraftPage"),
    createDraftPages: forbiddenWriter("createDraftPages"),
    updateDraftPageMetadata: forbiddenWriter("updateDraftPageMetadata"),
    updateDraftPageBlocks: forbiddenWriter("updateDraftPageBlocks"),
    updateDraftPageParent: forbiddenWriter("updateDraftPageParent"),
    detachDraftPageChildren: forbiddenWriter("detachDraftPageChildren"),
    deleteDraftPage: forbiddenWriter("deleteDraftPage"),
    existsById: async () => false,
    existsBySlug: async () => false,
    ...overrides,
  };
}

void test("createPage calls only createDraftPage with an explicit creation input", async () => {
  const inputs: CreateDraftPageInput[] = [];
  const pages = createPagesRepository({
    createDraftPage: async (input) => {
      inputs.push(input);
    },
  });
  const run = createPage({
    pages,
    idGenerator: { nextId: () => "created-page-id" },
    nowIso: () => NEXT_UPDATED_AT,
  });

  const result = await run({
    name: "Created page",
    slug: "created-page",
    seoTitle: "Created title",
    seoDescription: "Created description",
    parentId: null,
    sitemap: null,
    existingSlugs: new Set(),
    paginationEnabled: false,
  });

  assert.equal(result.page.id, "created-page-id");
  assert.deepEqual(inputs, [
    {
      pageId: "created-page-id",
      parentId: null,
      slug: "created-page",
      name: "Created page",
      seoTitle: "Created title",
      seoDescription: "Created description",
      blocks: [],
      sitemap: null,
      paginationEnabled: false,
      metaCreatedAt: NEXT_UPDATED_AT,
      metaUpdatedAt: NEXT_UPDATED_AT,
    },
  ]);
});

const blockMutationCases: ReadonlyArray<
  Readonly<{
    name: string;
    run: (pages: PagesRepository) => Promise<void>;
  }>
> = [
  {
    name: "createSectionBlock",
    run: async (pages) => {
      await createSectionBlock({
        pages,
        idGenerator: { nextId: () => "created-block" },
        nowIso: () => NEXT_UPDATED_AT,
      })({
        pageId: PAGE.id,
        name: "Created block",
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      });
    },
  },
  {
    name: "updateSectionBlock",
    run: async (pages) => {
      await updateSectionBlock({
        pages,
        nowIso: () => NEXT_UPDATED_AT,
      })({
        pageId: PAGE.id,
        blockId: BLOCK_A.id,
        patch: { name: "Updated block" },
      });
    },
  },
  {
    name: "deleteBlock",
    run: async (pages) => {
      await deleteBlock({
        pages,
        nowIso: () => NEXT_UPDATED_AT,
      })({
        pageId: PAGE.id,
        blockId: BLOCK_B.id,
      });
    },
  },
  {
    name: "reorderBlocks",
    run: async (pages) => {
      await reorderBlocks({
        pages,
        nowIso: () => NEXT_UPDATED_AT,
      })({
        pageId: PAGE.id,
        orderedBlockIds: [BLOCK_B.id, BLOCK_A.id],
      });
    },
  },
];

for (const mutation of blockMutationCases) {
  void test(`${mutation.name} calls only updateDraftPageBlocks`, async () => {
    const inputs: UpdateDraftPageBlocksInput[] = [];
    const pages = createPagesRepository({
      updateDraftPageBlocks: async (input) => {
        inputs.push(input);
      },
    });

    await mutation.run(pages);

    assert.equal(inputs.length, 1);
    assert.equal(inputs[0]?.pageId, PAGE.id);
    assert.equal(inputs[0]?.blocksRevision, PAGE_READ.revisions.blocksRevision);
    assert.equal(inputs[0]?.metaUpdatedAt, NEXT_UPDATED_AT);
    assert.deepEqual(Object.keys(inputs[0] ?? {}).sort(), [
      "blocks",
      "blocksRevision",
      "metaUpdatedAt",
      "pageId",
    ]);
  });
}

void test("updatePage metadata calls only updateDraftPageMetadata", async () => {
  const metadataInputs: UpdateDraftPageMetadataInput[] = [];
  const pages = createPagesRepository({
    updateDraftPageMetadata: async (input) => {
      metadataInputs.push(input);
    },
  });

  const result = await updatePage({
    pages,
    nowIso: () => NEXT_UPDATED_AT,
  })({
    pageId: PAGE.id,
    name: "Renamed page",
  });

  assert.equal(result.page.name, "Renamed page");
  assert.deepEqual(metadataInputs, [
    {
      pageId: PAGE.id,
      slug: PAGE.slug,
      name: "Renamed page",
      seoTitle: PAGE.seoTitle,
      seoDescription: PAGE.seoDescription,
      sitemap: PAGE.sitemap,
      paginationEnabled: PAGE.paginationEnabled,
      metaRevision: PAGE_READ.revisions.metaRevision,
      metaUpdatedAt: NEXT_UPDATED_AT,
    },
  ]);
});

void test("updatePage parent calls only updateDraftPageParent", async () => {
  const parentInputs: UpdateDraftPageParentInput[] = [];
  const pages = createPagesRepository({
    updateDraftPageParent: async (input) => {
      parentInputs.push(input);
    },
  });

  const result = await updatePage({
    pages,
    nowIso: () => NEXT_UPDATED_AT,
  })({
    pageId: PAGE.id,
    parentId: "next-parent",
  });

  assert.equal(result.page.parentId, "next-parent");
  assert.deepEqual(parentInputs, [
    {
      pageId: PAGE.id,
      parentId: "next-parent",
      metaUpdatedAt: NEXT_UPDATED_AT,
    },
  ]);
});

void test("updatePage mixed changes call metadata and parent writers once each", async () => {
  const metadataInputs: UpdateDraftPageMetadataInput[] = [];
  const parentInputs: UpdateDraftPageParentInput[] = [];
  const pages = createPagesRepository({
    updateDraftPageMetadata: async (input) => {
      metadataInputs.push(input);
    },
    updateDraftPageParent: async (input) => {
      parentInputs.push(input);
    },
  });

  await updatePage({
    pages,
    nowIso: () => NEXT_UPDATED_AT,
  })({
    pageId: PAGE.id,
    seoTitle: "Next SEO title",
    parentId: "next-parent",
  });

  assert.equal(metadataInputs.length, 1);
  assert.equal(parentInputs.length, 1);
  assert.equal(metadataInputs[0]?.metaUpdatedAt, NEXT_UPDATED_AT);
  assert.equal(parentInputs[0]?.metaUpdatedAt, NEXT_UPDATED_AT);
});

void test("deletePage calls only deleteDraftPage", async () => {
  const deletedPageIds: string[] = [];
  const pages = createPagesRepository({
    deleteDraftPage: async (pageId) => {
      deletedPageIds.push(pageId);
    },
  });

  assert.deepEqual(await deletePage({ pages })({ pageId: PAGE.id }), {
    ok: true,
    pageId: PAGE.id,
  });
  assert.deepEqual(deletedPageIds, [PAGE.id]);
});

void test("the PagesRepository fake rejects detachDraftPageChildren by default", async () => {
  const pages = createPagesRepository();
  const input: DetachDraftPageChildrenInput = {
    parentId: PAGE.id,
    metaUpdatedAt: NEXT_UPDATED_AT,
  };

  await assert.rejects(
    () => pages.detachDraftPageChildren(input),
    /Foreign writer called/,
  );
});
