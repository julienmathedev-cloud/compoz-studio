/**
 * @file apps/studio/src/features/pages/cache/page-metadata-conflict-cache.test.ts
 * @layer studio/features/pages/cache
 * @description Tests cache synchronization after explicit remote metadata adoption.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { adoptPageMetadataConflictCurrentCache } from "@compoz/studio/features/pages/cache/page-metadata-conflict-cache";
import { submitPageUpdateMutation } from "@compoz/studio/features/pages/hooks/page-update-submission";
import { toPageFormValuesFromDraftSources } from "@compoz/studio/features/pages/mappers/pages-form";
import {
  getDraftStructureCache,
  setDraftStructureCache,
} from "@compoz/studio/features/site-index/cache";

const WEBSITE_ID = "website-a";
const PAGE_ID = "page";
const STATE = CONTENT_STATE.DRAFT;

const CURRENT_PAGE: PageWithRevisionsDTO = {
  page: {
    id: PAGE_ID,
    parentId: "stale-page-parent",
    slug: "local",
    name: "Local",
    seoTitle: "Local SEO",
    seoDescription: "Local description",
    blocks: [
      {
        id: "local-block",
        type: "section",
        name: "Local block",
        containerMode: "contained",
        lcpPriority: false,
        rows: [],
      },
    ],
    sitemap: null,
    paginationEnabled: false,
    meta: {
      createdAt: "2026-07-29T10:00:00.000Z",
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
  },
  revisions: { metaRevision: 2, blocksRevision: 9 },
};

const DETAILS: PageMetadataConflictDetails = {
  expectedMetaRevision: 2,
  currentMetaRevision: 3,
  conflicts: [
    {
      field: "name",
      baseline: "Initial",
      local: "Local",
      current: "Remote",
    },
  ],
  current: {
    page: {
      ...CURRENT_PAGE.page,
      parentId: "response-page-parent",
      slug: "remote",
      name: "Remote",
      seoTitle: "Remote SEO",
      seoDescription: "Remote description",
      blocks: [
        {
          id: "remote-block",
          type: "section",
          name: "Remote block",
          containerMode: "contained",
          lcpPriority: false,
          rows: [],
        },
      ],
      sitemap: {
        include: true,
        priority: 0.8,
        changefreq: "weekly",
      },
      paginationEnabled: true,
      meta: {
        ...CURRENT_PAGE.page.meta,
        updatedAt: "2026-07-29T12:00:00.000Z",
      },
    },
    revisions: { metaRevision: 3, blocksRevision: 4 },
  },
};

function metadataConflict(): HttpError {
  return new HttpError(
    ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
    {
      status: 409,
      code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
      body: {
        error: {
          code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
          details: DETAILS,
        },
      },
    },
  );
}

function createCaches(): QueryClient {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    pageByIdKey(WEBSITE_ID, PAGE_ID, STATE),
    CURRENT_PAGE,
  );
  setDraftStructureCache(
    queryClient,
    WEBSITE_ID,
    STATE,
    {
      index: {
        pages: [
          {
            id: "sibling",
            slug: "sibling",
            name: "Sibling",
            parentId: null,
            metaRevision: 1,
          },
          {
            id: PAGE_ID,
            slug: "local",
            name: "Local",
            parentId: "structural-parent",
            metaRevision: 2,
          },
        ],
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
      draftStructureRevision: 7,
    },
  );
  return queryClient;
}

void test("409 receipt keeps caches untouched until explicit remote adoption", async () => {
  const queryClient = createCaches();
  const pageBefore = queryClient.getQueryData(
    pageByIdKey(WEBSITE_ID, PAGE_ID, STATE),
  );
  const structureBefore = getDraftStructureCache(
    queryClient,
    WEBSITE_ID,
    STATE,
  );
  let patchCalls = 0;
  let conflictCalls = 0;

  const outcome = await submitPageUpdateMutation({
    mutate: () => {
      patchCalls += 1;
      return Promise.reject(metadataConflict());
    },
    onMetadataConflict: () => {
      conflictCalls += 1;
    },
    onUnexpectedError: () => {
      assert.fail("metadata conflict must not use generic error handling");
    },
  });

  assert.equal(outcome, "metadataConflict");
  assert.equal(conflictCalls, 1);
  assert.strictEqual(
    queryClient.getQueryData(
      pageByIdKey(WEBSITE_ID, PAGE_ID, STATE),
    ),
    pageBefore,
  );
  assert.strictEqual(
    getDraftStructureCache(queryClient, WEBSITE_ID, STATE),
    structureBefore,
  );

  adoptPageMetadataConflictCurrentCache(
    queryClient,
    WEBSITE_ID,
    DETAILS,
    STATE,
  );

  const adoptedPage = queryClient.getQueryData<PageWithRevisionsDTO>(
    pageByIdKey(WEBSITE_ID, PAGE_ID, STATE),
  );
  const adoptedStructure = getDraftStructureCache(
    queryClient,
    WEBSITE_ID,
    STATE,
  );
  assert.equal(patchCalls, 1, "adoption must not start another PATCH");
  assert.equal(adoptedPage?.page.name, "Remote");
  assert.equal(adoptedPage?.page.slug, "remote");
  assert.equal(adoptedPage?.page.seoTitle, "Remote SEO");
  assert.equal(
    adoptedPage?.page.seoDescription,
    "Remote description",
  );
  assert.deepEqual(adoptedPage?.page.sitemap, DETAILS.current.page.sitemap);
  assert.equal(adoptedPage?.page.paginationEnabled, true);
  assert.equal(adoptedPage?.page.blocks[0]?.id, "local-block");
  assert.equal(adoptedPage?.revisions.blocksRevision, 9);
  assert.equal(adoptedPage?.revisions.metaRevision, 3);
  assert.equal(adoptedPage?.page.parentId, "structural-parent");
  assert.deepEqual(
    adoptedStructure?.index.pages.map((page) => page.id),
    ["sibling", PAGE_ID],
  );
  assert.equal(adoptedStructure?.draftStructureRevision, 7);
  assert.equal(adoptedStructure?.index.pages[1]?.name, "Remote");
  assert.equal(adoptedStructure?.index.pages[1]?.slug, "remote");
  assert.equal(adoptedStructure?.index.pages[1]?.metaRevision, 3);
  assert.equal(
    adoptedStructure?.index.pages[1]?.parentId,
    "structural-parent",
  );
  assert.strictEqual(
    adoptedStructure?.index.pages[0],
    structureBefore?.index.pages[0],
  );

  const remountedValues = toPageFormValuesFromDraftSources(
    adoptedPage?.page,
    adoptedStructure?.index.pages[1]?.parentId,
    PAGE_ID,
  );
  assert.equal(remountedValues.name, "Remote");
  assert.equal(remountedValues.slug, "remote");
  assert.equal(remountedValues.parentId, "structural-parent");
});

void test("metadata adoption never creates a missing structural snapshot", () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    pageByIdKey(WEBSITE_ID, PAGE_ID, STATE),
    CURRENT_PAGE,
  );

  adoptPageMetadataConflictCurrentCache(
    queryClient,
    WEBSITE_ID,
    DETAILS,
    STATE,
  );

  assert.equal(
    getDraftStructureCache(queryClient, WEBSITE_ID, STATE),
    undefined,
  );
});
