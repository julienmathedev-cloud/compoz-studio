/**
 * @file packages/infra/src/pages/prisma-pages-repository.test.ts
 * @layer infra/pages
 * @description Unit tests for the non-structural Prisma Page repository.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";

const WEBSITE_ID = "website-a";
const UPDATED_AT = "2026-07-29T10:00:00.000Z";

type Calls = {
  findUnique: unknown[];
  findMany: unknown[];
  update: unknown[];
};

function repository(options?: { row?: unknown; rows?: unknown[] }) {
  const calls: Calls = { findUnique: [], findMany: [], update: [] };
  const client = {
    website: { upsert: async () => ({}) },
    page: {
      findUnique: async (args: unknown) => {
        calls.findUnique.push(args);
        return options?.row ?? null;
      },
      findMany: async (args: unknown) => {
        calls.findMany.push(args);
        return options?.rows ?? [];
      },
      update: async (args: unknown) => {
        calls.update.push(args);
        return {};
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

void test("readById scopes the compound lookup by Website and state", async () => {
  const { calls, repository: pages } = repository();

  assert.equal(
    await pages.readById(CONTENT_STATE.DRAFT, "page-a"),
    null,
  );
  assert.deepEqual(calls.findUnique, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: "page-a",
        },
      },
    },
  ]);
});

void test("readManyById scopes by Website and draft state and preserves missing slots", async () => {
  const { calls, repository: pages } = repository({ rows: [] });

  assert.deepEqual(
    await pages.readManyById(CONTENT_STATE.DRAFT, ["a", "", "b"]),
    [null, null, null],
  );
  assert.deepEqual(calls.findMany, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        pageId: { in: ["a", "b"] },
      },
    },
  ]);
});

void test("metadata writer keeps its strict allowlist", async () => {
  const { calls, repository: pages } = repository();

  await pages.updateDraftPageMetadata({
    pageId: "page-a",
    slug: "renamed",
    name: "Renamed",
    seoTitle: null,
    seoDescription: "Description",
    sitemap: null,
    paginationEnabled: false,
    metaRevision: 7,
    metaUpdatedAt: UPDATED_AT,
  });

  assert.deepEqual(calls.update, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: "page-a",
        },
      },
      data: {
        slug: "renamed",
        name: "Renamed",
        seoTitle: null,
        seoDescription: "Description",
        sitemap: Prisma.JsonNull,
        paginationEnabled: false,
        metaRevision: 7,
        metaUpdatedAt: new Date(UPDATED_AT),
      },
    },
  ]);
});

void test("blocks writer cannot overwrite structure or metadata fields", async () => {
  const { calls, repository: pages } = repository();

  await pages.updateDraftPageBlocks({
    pageId: "page-a",
    blocks: [],
    blocksRevision: 5,
    metaUpdatedAt: UPDATED_AT,
  });

  assert.deepEqual(calls.update, [
    {
      where: {
        websiteId_state_pageId: {
          websiteId: WEBSITE_ID,
          state: "draft",
          pageId: "page-a",
        },
      },
      data: {
        blocks: [],
        blocksRevision: 5,
        metaUpdatedAt: new Date(UPDATED_AT),
      },
    },
  ]);
});
