/**
 * @file packages/infra/src/http/studio/pages.client.test.ts
 * @layer infra/http/studio
 * @description Verifies every structural HTTP client mutation transports its OCC revision.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";

const SNAPSHOT = {
  index: { pages: [], updatedAt: "2026-07-29T10:00:00.000Z" },
  draftStructureRevision: 4,
};

void test("create, parent PATCH, delete, and reorder serialize expectedDraftStructureRevision", async (context) => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  context.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      const page = {
        id: "page",
        parentId: null,
        slug: "page",
        name: "Page",
        seoTitle: null,
        seoDescription: null,
        blocks: [],
        meta: {
          createdAt: SNAPSHOT.index.updatedAt,
          updatedAt: SNAPSHOT.index.updatedAt,
        },
        sitemap: null,
        paginationEnabled: false,
      };

      return new Response(
        JSON.stringify({
          ...SNAPSHOT,
          page,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  );

  await pagesStudioApi.create({
    name: "Page",
    seoTitle: null,
    seoDescription: null,
    parentId: null,
    sitemap: null,
    paginationEnabled: false,
    expectedDraftStructureRevision: 3,
  });
  await pagesStudioApi.update("page", {
    parentChange: {
      baseline: null,
      local: "parent",
      expectedDraftStructureRevision: 4,
    },
  });
  await pagesStudioApi.remove("page", {
    expectedDraftStructureRevision: 5,
  });
  await pagesStudioApi.reorderChildren("parent", {
    childIds: [],
    expectedDraftStructureRevision: 6,
  });

  assert.deepEqual(
    requests.map((request) => ({
      method: request.init?.method,
      body: JSON.parse(String(request.init?.body)),
    })),
    [
      {
        method: "POST",
        body: {
          name: "Page",
          seoTitle: null,
          seoDescription: null,
          parentId: null,
          sitemap: null,
          paginationEnabled: false,
          expectedDraftStructureRevision: 3,
        },
      },
      {
        method: "PATCH",
        body: {
          parentChange: {
            baseline: null,
            local: "parent",
            expectedDraftStructureRevision: 4,
          },
        },
      },
      {
        method: "DELETE",
        body: { expectedDraftStructureRevision: 5 },
      },
      {
        method: "POST",
        body: {
          childIds: [],
          expectedDraftStructureRevision: 6,
        },
      },
    ],
  );
});

void test("block clients serialize exact OCC intent payloads and PATCH omits blockId", async (context) => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  context.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response(
        JSON.stringify({
          outcome: "updated",
          blocks: [],
          blocksRevision: 2,
          createdBlockId: "new",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  );

  const block = {
    id: "a",
    type: "section" as const,
    name: "A",
    containerMode: "contained" as const,
    lcpPriority: false,
    rows: [],
  };
  await pagesStudioApi.addBlock("page", {
    expectedBlocksRevision: 1,
    baselineOrder: ["a"],
    baselineLcpPriorityBlockId: null,
    placement: { kind: "end" },
    containerMode: "contained",
    cssClassName: "",
    lcpPriority: false,
    rows: [],
  });
  await pagesStudioApi.updateBlock("page", "a", {
    expectedBlocksRevision: 1,
    baselineLcpPriorityBlockId: null,
    changes: { name: { baseline: "A", local: "Renamed" } },
  });
  await pagesStudioApi.deleteBlock("page", "a", {
    expectedBlocksRevision: 1,
    baselineBlock: block,
  });
  await pagesStudioApi.reorderBlocks("page", {
    expectedBlocksRevision: 1,
    baselineOrder: ["a", "b"],
    localOrder: ["b", "a"],
  });

  const bodies = requests.map((request) =>
    JSON.parse(String(request.init?.body)),
  );
  assert.deepEqual(bodies[0], {
    expectedBlocksRevision: 1,
    baselineOrder: ["a"],
    baselineLcpPriorityBlockId: null,
    placement: { kind: "end" },
    containerMode: "contained",
    cssClassName: "",
    lcpPriority: false,
    rows: [],
  });
  assert.deepEqual(bodies[1], {
    expectedBlocksRevision: 1,
    baselineLcpPriorityBlockId: null,
    changes: { name: { baseline: "A", local: "Renamed" } },
  });
  assert.equal("blockId" in bodies[1], false);
  assert.deepEqual(bodies[2], {
    expectedBlocksRevision: 1,
    baselineBlock: block,
  });
  assert.deepEqual(bodies[3], {
    expectedBlocksRevision: 1,
    baselineOrder: ["a", "b"],
    localOrder: ["b", "a"],
  });
});

void test("an empty block update still calls PATCH and returns the authoritative no-op snapshot", async (context) => {
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      calls++;
      assert.equal(init?.method, "PATCH");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        expectedBlocksRevision: 7,
        baselineLcpPriorityBlockId: "owner-a",
        changes: {},
      });
      return new Response(
        JSON.stringify({
          outcome: "noChanges",
          blocks: [],
          blocksRevision: 8,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  );

  const response = await pagesStudioApi.updateBlock("page", "block", {
    expectedBlocksRevision: 7,
    baselineLcpPriorityBlockId: "owner-a",
    changes: {},
  });
  assert.equal(calls, 1);
  assert.equal(response.outcome, "noChanges");
  assert.equal(response.blocksRevision, 8);
});
