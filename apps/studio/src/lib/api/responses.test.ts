/**
 * @file apps/studio/src/lib/api/responses.test.ts
 * @layer studio/lib/api
 * @description Unit tests for Studio HTTP error envelopes.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { toHttpError } from "@compoz/infra/http/error-adapter";
import { jsonHttpError } from "@compoz/studio/lib/api/responses";

void test("includes revision-conflict details in the standard error envelope", async () => {
  const httpError = toHttpError(
    new DomainError({
      code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      details: {
        resourceId: "footer",
        expectedRevision: 2,
        currentRevision: 3,
        conflictingPaths: ["copyright"],
      },
    }),
  );
  const response = jsonHttpError(httpError.status, httpError.body);

  assert.deepEqual(await response.json(), {
    error: {
      code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      message: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      details: {
        resourceId: "footer",
        expectedRevision: 2,
        currentRevision: 3,
        conflictingPaths: ["copyright"],
      },
    },
  });
});
