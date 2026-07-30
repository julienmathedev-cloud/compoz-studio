/**
 * @file packages/infra/src/pages/prisma-pages-repository.test.ts
 * @layer infra/pages
 * @description Unit tests for the non-structural Prisma Page repository.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import type { PrismaClient } from "@compoz/infra/prisma/generated";

const WEBSITE_ID = "website-a";
const UPDATED_AT = "2026-07-29T10:00:00.000Z";

type Calls = {
  findUnique: unknown[];
  findMany: unknown[];
  updateMany: unknown[];
};

function repository(options?: { row?: unknown; rows?: unknown[]; count?: number }) {
  const calls: Calls = { findUnique: [], findMany: [], updateMany: [] };
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
      updateMany: async (args: unknown) => {
        calls.updateMany.push(args);
        return { count: options?.count ?? 1 };
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

void test("blocks writer cannot overwrite structure or metadata fields", async () => {
  const { calls, repository: pages } = repository();

  assert.equal(await pages.compareAndSetDraftPageBlocks({
    pageId: "page-a",
    blocks: [],
    expectedBlocksRevision: 5,
    metaUpdatedAt: UPDATED_AT,
  }), true);

  assert.deepEqual(calls.updateMany, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        pageId: "page-a",
        blocksRevision: 5,
      },
      data: {
        blocks: [],
        blocksRevision: { increment: 1 },
        metaUpdatedAt: new Date(UPDATED_AT),
      },
    },
  ]);
});

void test("blocks CAS returns false when no draft row matches the revision", async () => {
  const { repository: pages } = repository({ count: 0 });
  assert.equal(await pages.compareAndSetDraftPageBlocks({
    pageId: "page-a",
    blocks: [],
    expectedBlocksRevision: 4,
    metaUpdatedAt: UPDATED_AT,
  }), false);
});
