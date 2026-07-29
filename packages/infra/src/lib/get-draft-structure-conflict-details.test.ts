/**
 * @file packages/infra/src/lib/get-draft-structure-conflict-details.test.ts
 * @layer infra/lib/http
 * @description Tests safe parsing of structure conflict snapshots.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { getDraftStructureConflictDetails } from "@compoz/infra/lib/get-draft-structure-conflict-details";

const DETAILS = {
  expectedDraftStructureRevision: 2,
  currentDraftStructureRevision: 3,
  current: {
    index: {
      pages: [
        { id: "page", slug: "page", name: "Page", parentId: null },
      ],
      updatedAt: "2026-07-29T10:00:00.000Z",
    },
    draftStructureRevision: 3,
  },
};

function conflict(details: unknown, status = 409) {
  return new HttpError(ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT, {
    status,
    code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
        details,
      },
    },
  });
}

void test("extracts a valid current structure snapshot", () => {
  assert.deepEqual(
    getDraftStructureConflictDetails(conflict(DETAILS)),
    DETAILS,
  );
});

void test("rejects malformed, negative, and unrelated conflicts", () => {
  assert.equal(
    getDraftStructureConflictDetails(
      conflict({ ...DETAILS, currentDraftStructureRevision: -1 }),
    ),
    null,
  );
  assert.equal(
    getDraftStructureConflictDetails(conflict(DETAILS, 400)),
    null,
  );
  assert.equal(
    getDraftStructureConflictDetails(
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
