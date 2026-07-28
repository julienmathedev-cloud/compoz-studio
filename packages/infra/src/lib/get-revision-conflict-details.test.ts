/**
 * @file packages/infra/src/lib/get-revision-conflict-details.test.ts
 * @layer infra/lib/http
 * @description Unit tests for safe revision-conflict detail extraction.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { getRevisionConflictDetails } from "@compoz/infra/lib/get-revision-conflict-details";

function revisionConflictError(details: unknown, status = 409): HttpError {
  return new HttpError(ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT, {
    status,
    code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
        message: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
        details,
      },
    },
  });
}

const VALID_DETAILS = {
  resourceId: "footer",
  expectedRevision: 2,
  currentRevision: 3,
  conflictingPaths: ["copyright"],
};

void test("extracts a valid revision conflict envelope", () => {
  assert.deepEqual(
    getRevisionConflictDetails(revisionConflictError(VALID_DETAILS)),
    VALID_DETAILS,
  );
});

void test("rejects an envelope without details", () => {
  const error = new HttpError(ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT, {
    status: 409,
    code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
        message: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      },
    },
  });

  assert.equal(getRevisionConflictDetails(error), null);
});

void test("rejects an error with a status other than 409", () => {
  assert.equal(
    getRevisionConflictDetails(revisionConflictError(VALID_DETAILS, 400)),
    null,
  );
});

void test("rejects non-OCC conflict codes", () => {
  const error = new HttpError(ERROR_CODES.CONFLICT, {
    status: 409,
    code: ERROR_CODES.CONFLICT,
    body: {
      error: {
        code: ERROR_CODES.CONFLICT,
        message: ERROR_CODES.CONFLICT,
        details: VALID_DETAILS,
      },
    },
  });

  assert.equal(getRevisionConflictDetails(error), null);
});

void test("rejects negative revisions", () => {
  assert.equal(
    getRevisionConflictDetails(
      revisionConflictError({ ...VALID_DETAILS, expectedRevision: -1 }),
    ),
    null,
  );
});

void test("rejects decimal revisions", () => {
  assert.equal(
    getRevisionConflictDetails(
      revisionConflictError({ ...VALID_DETAILS, currentRevision: 3.5 }),
    ),
    null,
  );
});

void test("rejects empty resource identifiers", () => {
  assert.equal(
    getRevisionConflictDetails(
      revisionConflictError({ ...VALID_DETAILS, resourceId: "" }),
    ),
    null,
  );
});

void test("rejects empty conflicting paths", () => {
  assert.equal(
    getRevisionConflictDetails(
      revisionConflictError({ ...VALID_DETAILS, conflictingPaths: [""] }),
    ),
    null,
  );
});

void test("rejects an empty conflicting path list", () => {
  assert.equal(
    getRevisionConflictDetails(
      revisionConflictError({ ...VALID_DETAILS, conflictingPaths: [] }),
    ),
    null,
  );
});

void test("normalizes resource identifiers and conflicting paths", () => {
  assert.deepEqual(
    getRevisionConflictDetails(
      revisionConflictError({
        ...VALID_DETAILS,
        resourceId: "  footer  ",
        conflictingPaths: ["  copyright  "],
      }),
    ),
    VALID_DETAILS,
  );
});

void test("rejects non-HTTP errors", () => {
  assert.equal(getRevisionConflictDetails(new Error("unrelated")), null);
});
