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
