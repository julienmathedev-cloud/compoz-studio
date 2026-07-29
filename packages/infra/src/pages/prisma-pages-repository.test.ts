/**
 * @file packages/infra/src/pages/prisma-pages-repository.test.ts
 * @layer infra/pages
 * @description Unit tests for the narrow Prisma draft Page writers.
 * @remarks Uses a fully in-memory Prisma client double and never opens a database connection.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { CreateDraftPageInput } from "@compoz/core/domain/pages/ports/pages-repository";
import { toPrismaPublishedPageCreateData } from "@compoz/infra/pages/mappers/page.mapper";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";

const WEBSITE_ID = "website-sentinel";
const META_CREATED_AT = "2026-01-02T03:04:05.000Z";
const META_UPDATED_AT = "2026-02-03T04:05:06.000Z";
const NEXT_META_UPDATED_AT = "2026-03-04T05:06:07.000Z";

const BLOCKS: ReadonlyArray<Block> = [
  {
    id: "block-sentinel",
    type: "section",
    name: "Blocks sentinel",
    containerMode: "contained",
    lcpPriority: false,
    rows: [],
  },
];

const CREATE_INPUT: CreateDraftPageInput = {
  pageId: "page-sentinel",
  parentId: "parent-sentinel",
  slug: "slug-sentinel",
  name: "Metadata sentinel",
  seoTitle: "SEO title sentinel",
  seoDescription: "SEO description sentinel",
  blocks: BLOCKS,
  sitemap: {
    include: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  paginationEnabled: true,
  metaCreatedAt: META_CREATED_AT,
  metaUpdatedAt: META_UPDATED_AT,
};

type RepositoryCalls = {
  websiteUpsert: unknown[];
  aggregate: unknown[];
  create: unknown[];
  createMany: unknown[];
  findUnique: unknown[];
  update: unknown[];
  updateMany: unknown[];
  deleteMany: unknown[];
};

function createRepository(options?: Readonly<{
  maxPosition?: number | null;
  slugOwnerPageId?: string;
  updateManyCount?: number;
}>) {
  const calls: RepositoryCalls = {
    websiteUpsert: [],
    aggregate: [],
    create: [],
    createMany: [],
    findUnique: [],
    update: [],
    updateMany: [],
    deleteMany: [],
  };

  const client = {
    website: {
      upsert: async (args: unknown) => {
        calls.websiteUpsert.push(args);
        return {};
      },
    },
    page: {
      aggregate: async (args: unknown) => {
        calls.aggregate.push(args);
        return { _max: { position: options?.maxPosition ?? null } };
      },
      create: async (args: unknown) => {
        calls.create.push(args);
        return {};
      },
      createMany: async (args: unknown) => {
        calls.createMany.push(args);
        return { count: 1 };
      },
      findUnique: async (args: unknown) => {
        calls.findUnique.push(args);
        return options?.slugOwnerPageId
          ? { pageId: options.slugOwnerPageId }
          : null;
      },
      update: async (args: unknown) => {
        calls.update.push(args);
        return {};
      },
      updateMany: async (args: unknown) => {
        calls.updateMany.push(args);
        return { count: options?.updateManyCount ?? 0 };
      },
      deleteMany: async (args: unknown) => {
        calls.deleteMany.push(args);
        return { count: 0 };
      },
    },
  };

  return {
    calls,
    repository: new PrismaPagesRepository({
      websiteId: WEBSITE_ID,
      client: client as unknown as PrismaClient,
    }),
  };
}

void test("createDraftPage creates one strict draft row at the next position", async () => {
  const { calls, repository } = createRepository({ maxPosition: 41 });

  await repository.createDraftPage(CREATE_INPUT);

  assert.equal(calls.websiteUpsert.length, 1);
  assert.deepEqual(calls.aggregate, [
    {
      where: { websiteId: WEBSITE_ID, state: "draft" },
      _max: { position: true },
    },
  ]);
  assert.deepEqual(calls.create, [
    {
      data: {
        websiteId: WEBSITE_ID,
        state: "draft",
        pageId: CREATE_INPUT.pageId,
        position: 42,
        parentPageId: CREATE_INPUT.parentId,
        slug: CREATE_INPUT.slug,
        name: CREATE_INPUT.name,
        seoTitle: CREATE_INPUT.seoTitle,
        seoDescription: CREATE_INPUT.seoDescription,
        blocks: BLOCKS,
        sitemap: CREATE_INPUT.sitemap,
        paginationEnabled: true,
        metaRevision: 0,
        blocksRevision: 0,
        metaCreatedAt: new Date(META_CREATED_AT),
        metaUpdatedAt: new Date(META_UPDATED_AT),
      },
    },
  ]);
});

void test("createDraftPages is an empty no-op and otherwise assigns deterministic positions", async () => {
  const { calls, repository } = createRepository({ maxPosition: 7 });

  await repository.createDraftPages([]);

  assert.deepEqual(calls.websiteUpsert, []);
  assert.deepEqual(calls.aggregate, []);
  assert.deepEqual(calls.createMany, []);

  const secondInput: CreateDraftPageInput = {
    ...CREATE_INPUT,
    pageId: "page-second",
    slug: "slug-second",
    parentId: null,
  };

  await repository.createDraftPages([CREATE_INPUT, secondInput]);

  assert.equal(calls.websiteUpsert.length, 1);
  assert.deepEqual(calls.createMany, [
    {
      data: [
        {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: CREATE_INPUT.pageId,
          position: 8,
          parentPageId: CREATE_INPUT.parentId,
          slug: CREATE_INPUT.slug,
          name: CREATE_INPUT.name,
          seoTitle: CREATE_INPUT.seoTitle,
          seoDescription: CREATE_INPUT.seoDescription,
          blocks: BLOCKS,
          sitemap: CREATE_INPUT.sitemap,
          paginationEnabled: true,
          metaRevision: 0,
          blocksRevision: 0,
          metaCreatedAt: new Date(META_CREATED_AT),
          metaUpdatedAt: new Date(META_UPDATED_AT),
        },
        {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: secondInput.pageId,
          position: 9,
          parentPageId: null,
          slug: secondInput.slug,
          name: secondInput.name,
          seoTitle: secondInput.seoTitle,
          seoDescription: secondInput.seoDescription,
          blocks: BLOCKS,
          sitemap: secondInput.sitemap,
          paginationEnabled: true,
          metaRevision: 0,
          blocksRevision: 0,
          metaCreatedAt: new Date(META_CREATED_AT),
          metaUpdatedAt: new Date(META_UPDATED_AT),
        },
      ],
    },
  ]);
  assert.equal(
    Object.hasOwn(calls.createMany[0] as object, "skipDuplicates"),
    false,
  );
});

void test("createDraftPages rejects duplicate slugs before touching Prisma", async () => {
  const { calls, repository } = createRepository();

  await assert.rejects(
    () =>
      repository.createDraftPages([
        CREATE_INPUT,
        { ...CREATE_INPUT, pageId: "another-page" },
      ]),
    /duplicate slug in batch/,
  );
  assert.deepEqual(calls.websiteUpsert, []);
  assert.deepEqual(calls.createMany, []);
});

void test("updateDraftPageMetadata writes only the metadata allowlist", async () => {
  const { calls, repository } = createRepository();

  await repository.updateDraftPageMetadata({
    pageId: CREATE_INPUT.pageId,
    slug: "metadata-slug",
    name: "Metadata name",
    seoTitle: "Metadata title",
    seoDescription: "Metadata description",
    sitemap: null,
    paginationEnabled: false,
    metaRevision: 17,
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });

  assert.deepEqual(calls.update, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: CREATE_INPUT.pageId,
        },
      },
      data: {
        slug: "metadata-slug",
        name: "Metadata name",
        seoTitle: "Metadata title",
        seoDescription: "Metadata description",
        sitemap: Prisma.JsonNull,
        paginationEnabled: false,
        metaRevision: 17,
        metaUpdatedAt: new Date(NEXT_META_UPDATED_AT),
      },
    },
  ]);
});

void test("updateDraftPageMetadata rejects a slug owned by another draft page", async () => {
  const { calls, repository } = createRepository({
    slugOwnerPageId: "another-page",
  });

  await assert.rejects(
    () =>
      repository.updateDraftPageMetadata({
        pageId: CREATE_INPUT.pageId,
        slug: "conflicting-slug",
        name: CREATE_INPUT.name,
        seoTitle: CREATE_INPUT.seoTitle,
        seoDescription: CREATE_INPUT.seoDescription,
        sitemap: CREATE_INPUT.sitemap,
        paginationEnabled: CREATE_INPUT.paginationEnabled,
        metaRevision: 17,
        metaUpdatedAt: NEXT_META_UPDATED_AT,
      }),
    /slug already exists/,
  );
  assert.deepEqual(calls.update, []);
});

void test("updateDraftPageBlocks writes exactly blocks, revision, and timestamp", async () => {
  const { calls, repository } = createRepository();

  await repository.updateDraftPageBlocks({
    pageId: CREATE_INPUT.pageId,
    blocks: BLOCKS,
    blocksRevision: 23,
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });

  assert.deepEqual(calls.update, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: CREATE_INPUT.pageId,
        },
      },
      data: {
        blocks: BLOCKS,
        blocksRevision: 23,
        metaUpdatedAt: new Date(NEXT_META_UPDATED_AT),
      },
    },
  ]);
});

void test("updateDraftPageParent writes exactly parent and timestamp", async () => {
  const { calls, repository } = createRepository();

  await repository.updateDraftPageParent({
    pageId: CREATE_INPUT.pageId,
    parentId: "next-parent",
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });

  assert.deepEqual(calls.update, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: CREATE_INPUT.pageId,
        },
      },
      data: {
        parentPageId: "next-parent",
        metaUpdatedAt: new Date(NEXT_META_UPDATED_AT),
      },
    },
  ]);
});

void test("detachDraftPageChildren targets draft children and returns Prisma count", async () => {
  const { calls, repository } = createRepository({ updateManyCount: 3 });

  const count = await repository.detachDraftPageChildren({
    parentId: CREATE_INPUT.parentId ?? "",
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });

  assert.equal(count, 3);
  assert.deepEqual(calls.updateMany, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        parentPageId: CREATE_INPUT.parentId,
      },
      data: {
        parentPageId: null,
        metaUpdatedAt: new Date(NEXT_META_UPDATED_AT),
      },
    },
  ]);
});

void test("deleteDraftPage is idempotent and targets only the draft row", async () => {
  const { calls, repository } = createRepository();

  await repository.deleteDraftPage(CREATE_INPUT.pageId);

  assert.deepEqual(calls.deleteMany, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        pageId: CREATE_INPUT.pageId,
      },
    },
  ]);
});

void test("no draft update payload can rewrite metaCreatedAt", async () => {
  const { calls, repository } = createRepository();

  await repository.updateDraftPageMetadata({
    pageId: CREATE_INPUT.pageId,
    slug: CREATE_INPUT.slug,
    name: CREATE_INPUT.name,
    seoTitle: CREATE_INPUT.seoTitle,
    seoDescription: CREATE_INPUT.seoDescription,
    sitemap: CREATE_INPUT.sitemap,
    paginationEnabled: CREATE_INPUT.paginationEnabled,
    metaRevision: 31,
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });
  await repository.updateDraftPageBlocks({
    pageId: CREATE_INPUT.pageId,
    blocks: BLOCKS,
    blocksRevision: 37,
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });
  await repository.updateDraftPageParent({
    pageId: CREATE_INPUT.pageId,
    parentId: null,
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });
  await repository.detachDraftPageChildren({
    parentId: CREATE_INPUT.parentId ?? "",
    metaUpdatedAt: NEXT_META_UPDATED_AT,
  });

  const updatePayloads = [
    ...calls.update.map((call) => (call as { data: object }).data),
    ...calls.updateMany.map((call) => (call as { data: object }).data),
  ];

  assert.equal(
    updatePayloads.some((data) => Object.hasOwn(data, "metaCreatedAt")),
    false,
  );
});

void test("published creation forces published state and zero revisions", () => {
  const published = toPrismaPublishedPageCreateData(
    WEBSITE_ID,
    {
      id: CREATE_INPUT.pageId,
      parentId: CREATE_INPUT.parentId,
      slug: CREATE_INPUT.slug,
      name: CREATE_INPUT.name,
      seoTitle: CREATE_INPUT.seoTitle,
      seoDescription: CREATE_INPUT.seoDescription,
      blocks: CREATE_INPUT.blocks,
      sitemap: CREATE_INPUT.sitemap,
      paginationEnabled: CREATE_INPUT.paginationEnabled,
      meta: {
        createdAt: CREATE_INPUT.metaCreatedAt,
        updatedAt: CREATE_INPUT.metaUpdatedAt,
      },
    },
    53,
  );

  assert.deepEqual(published, {
    websiteId: WEBSITE_ID,
    state: "published",
    pageId: CREATE_INPUT.pageId,
    position: 53,
    parentPageId: CREATE_INPUT.parentId,
    slug: CREATE_INPUT.slug,
    name: CREATE_INPUT.name,
    seoTitle: CREATE_INPUT.seoTitle,
    seoDescription: CREATE_INPUT.seoDescription,
    blocks: BLOCKS,
    sitemap: CREATE_INPUT.sitemap,
    paginationEnabled: true,
    metaRevision: 0,
    blocksRevision: 0,
    metaCreatedAt: new Date(META_CREATED_AT),
    metaUpdatedAt: new Date(META_UPDATED_AT),
  });
});
