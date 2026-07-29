/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-initializer.test.ts
 * @layer infra/pages
 * @description Tests deterministic sandbox draft initialization without SiteIndex rewrites.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { CreateDraftPageInput } from "@compoz/core/domain/pages/ports/pages-repository";
import { PrismaDraftPageStructureInitializer } from "@compoz/infra/pages/prisma-draft-page-structure-initializer";
import type { PrismaClient } from "@compoz/infra/prisma/generated";

const AT = "2026-07-29T10:00:00.000Z";
const input = (
  pageId: string,
  parentId: string | null,
): CreateDraftPageInput => ({
  pageId,
  parentId,
  slug: pageId,
  name: pageId,
  seoTitle: null,
  seoDescription: null,
  blocks: [],
  sitemap: null,
  paginationEnabled: parentId !== null,
  metaCreatedAt: AT,
  metaUpdatedAt: AT,
});

void test("initializes a new Website batch at deterministic zero-based positions", async () => {
  const calls: unknown[] = [];
  const client = {
    page: {
      createMany: async (args: unknown) => {
        calls.push(args);
        return { count: 2 };
      },
    },
  } as unknown as PrismaClient;
  const initializer = new PrismaDraftPageStructureInitializer({
    websiteId: "sandbox-a",
    client,
  });

  await initializer.createDraftPages([
    input("root", null),
    input("child", "root"),
  ]);

  const data = (calls[0] as { data: Array<{ position: number }> }).data;
  assert.deepEqual(
    data.map((item) => item.position),
    [0, 1],
  );
});

void test("empty initialization is a no-op", async () => {
  let calls = 0;
  const initializer = new PrismaDraftPageStructureInitializer({
    websiteId: "sandbox-a",
    client: {
      page: {
        createMany: async () => {
          calls += 1;
          return { count: 0 };
        },
      },
    } as unknown as PrismaClient,
  });

  await initializer.createDraftPages([]);
  assert.equal(calls, 0);
});
