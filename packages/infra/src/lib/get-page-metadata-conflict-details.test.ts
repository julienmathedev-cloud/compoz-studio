/**
 * @file packages/infra/src/lib/get-page-metadata-conflict-details.test.ts
 * @layer infra/lib/http
 * @description Tests safe parsing of page metadata conflict snapshots.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { getPageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";

const DETAILS = {
  expectedMetaRevision: 2,
  currentMetaRevision: 3,
  conflicts: [
    {
      field: "name",
      baseline: "Page",
      local: "Local",
      current: "Remote",
    },
  ],
  current: {
    page: {
      id: "page",
      parentId: null,
      slug: "page",
      name: "Remote",
      seoTitle: null,
      seoDescription: null,
      blocks: [],
      sitemap: null,
      paginationEnabled: false,
      meta: {
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T11:00:00.000Z",
      },
    },
    revisions: { metaRevision: 3, blocksRevision: 4 },
  },
} as const;

function conflict(details: unknown, status = 409) {
  return new HttpError(ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT, {
    status,
    code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
        details,
      },
    },
  });
}

void test("extracts a valid page metadata conflict", () => {
  assert.deepEqual(
    getPageMetadataConflictDetails(conflict(DETAILS)),
    DETAILS,
  );
});

void test("rejects malformed, unrelated, and non-409 envelopes", () => {
  assert.equal(
    getPageMetadataConflictDetails(
      conflict({ ...DETAILS, currentMetaRevision: -1 }),
    ),
    null,
  );
  assert.equal(getPageMetadataConflictDetails(conflict(DETAILS, 422)), null);
  assert.equal(
    getPageMetadataConflictDetails(
      new HttpError(ERROR_CODES.CONFLICT, {
        status: 409,
        code: ERROR_CODES.CONFLICT,
        body: {
          error: { code: ERROR_CODES.CONFLICT, details: DETAILS },
        },
      }),
    ),
    null,
  );
});
