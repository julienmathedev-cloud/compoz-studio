/**
 * @file packages/infra/src/lib/get-page-blocks-conflict-details.test.ts
 * @layer infra/lib/http
 * @description Defensive Page block conflict extractor tests.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";

const BLOCK = {
  id: "block-a",
  type: "section",
  name: "Block",
  containerMode: "contained",
  lcpPriority: false,
  rows: [],
};

const DETAILS = {
  resourceId: "page-a",
  expectedBlocksRevision: 2,
  currentBlocksRevision: 3,
  operation: "update",
  conflictKind: "functional",
  conflictingPaths: ["blocks[block-a].name"],
  conflicts: [{
    kind: "fieldConflict",
    path: "blocks[block-a].name",
    location: {
      kind: "blockField",
      blockId: "block-a",
      segments: [{ kind: "field", name: "name" }],
    },
    baseline: "before",
    current: "remote",
    local: "local",
  }],
  current: { blocks: [BLOCK], blocksRevision: 3 },
  candidateBlock: { ...BLOCK, name: "local" },
};

function http(
  details: unknown,
  code: string = ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
  status = 409,
) {
  return new HttpError(code, {
    status,
    body: { error: { code, details } },
  });
}

void test("extracts a fully valid 409 and candidate block", () => {
  assert.deepEqual(getPageBlocksConflictDetails(http(DETAILS)), DETAILS);
});

void test("rejects wrong status, code, snapshot revision, and conflict shapes", () => {
  assert.equal(getPageBlocksConflictDetails(http(DETAILS, "OTHER")), null);
  assert.equal(
    getPageBlocksConflictDetails(
      http(DETAILS, ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT, 400),
    ),
    null,
  );
  assert.equal(
    getPageBlocksConflictDetails(
      http({ ...DETAILS, current: { blocks: [BLOCK], blocksRevision: -1 } }),
    ),
    null,
  );
  assert.equal(
    getPageBlocksConflictDetails(
      http({ ...DETAILS, conflicts: [{ kind: "unknown", path: "x" }] }),
    ),
    null,
  );
  assert.equal(getPageBlocksConflictDetails(new Error("other")), null);
});

void test("keeps valid 409 details while dropping an invalid candidate block", () => {
  const extracted = getPageBlocksConflictDetails(
    http({
      ...DETAILS,
      candidateBlock: {
        ...BLOCK,
        rows: [{ id: "row", columnsCount: 2, reverseOn: {
          mobile: false,
          tablet: false,
          desktop: false,
        }, columns: [] }],
      },
    }),
  );
  assert.ok(extracted);
  assert.equal(extracted.candidateBlock, undefined);
  assert.deepEqual(extracted.conflicts, DETAILS.conflicts);
});
