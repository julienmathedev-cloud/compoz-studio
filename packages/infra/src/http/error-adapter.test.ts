/**
 * @file packages/infra/src/http/error-adapter.test.ts
 * @layer infra/http
 * @description Unit tests for domain-error HTTP mapping.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { FooterSettingsSchema } from "@compoz/validation/site/settings/footer/footer";
import { statusFromCode, toHttpError } from "@compoz/infra/http/error-adapter";

void test("maps revision preconditions and settings revision conflicts to stable statuses", () => {
  assert.equal(statusFromCode(ERROR_CODES.REVISION_REQUIRED), 428);
  assert.equal(
    statusFromCode(ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT),
    409,
  );
  assert.equal(
    statusFromCode(ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT),
    409,
  );
  assert.equal(
    statusFromCode(ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT),
    409,
  );
  assert.equal(
    statusFromCode(ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT),
    409,
  );
  assert.equal(statusFromCode(ERROR_CODES.PAGE_SLUG_CONFLICT), 409);
  assert.equal(statusFromCode(ERROR_CODES.PAGE_REORDER_INVALID), 422);
  assert.equal(statusFromCode(ERROR_CODES.PAGE_HIERARCHY_CYCLE), 422);
  assert.equal(statusFromCode(ERROR_CODES.PAGE_PARENT_INVALID), 422);
});

void test("exposes controlled Page block conflict details", () => {
  const details = {
    resourceId: "page",
    expectedBlocksRevision: 2,
    currentBlocksRevision: 3,
    operation: "update",
    conflictKind: "functional",
    conflictingPaths: ["blocks[a].name"],
    conflicts: [],
    current: { blocks: [], blocksRevision: 3 },
  };
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
      details,
    }),
  );
  assert.equal(response.status, 409);
  assert.deepEqual(response.body.details, details);
});

void test("exposes aggregated page metadata conflict details", () => {
  const details = {
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
      page: { id: "page" },
      revisions: { metaRevision: 3, blocksRevision: 4 },
    },
  };
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
      details,
    }),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(response.body.details, details);
});

void test("exposes the current structure snapshot on OCC conflict", () => {
  const details = {
    expectedDraftStructureRevision: 2,
    currentDraftStructureRevision: 3,
    current: {
      index: { pages: [], updatedAt: "2026-07-29T10:00:00.000Z" },
      draftStructureRevision: 3,
    },
  };
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
      details,
    }),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(response.body.details, details);
});

void test("maps publication conflicts to 409 without exposing technical details", () => {
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.PUBLISH_CONFLICT,
      details: {
        operation: "publish_site",
        attempts: 3,
        conflictKind: "P2010_40001",
      },
      cause: new Error("database details"),
    }),
  );

  assert.equal(statusFromCode(ERROR_CODES.PUBLISH_CONFLICT), 409);
  assert.equal(response.status, 409);
  assert.equal(response.body.code, ERROR_CODES.PUBLISH_CONFLICT);
  assert.equal("details" in response.body, false);
  assert.equal("cause" in response.body, false);
});

void test("preserves DomainError details without exposing its cause", () => {
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
      details: {
        resourceId: "footer",
        expectedRevision: 2,
        currentRevision: 3,
        conflictingPaths: ["copyright"],
      },
      cause: new Error("database details"),
    }),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(response.body.details, {
    resourceId: "footer",
    expectedRevision: 2,
    currentRevision: 3,
    conflictingPaths: ["copyright"],
  });
  assert.equal("cause" in response.body, false);
});

void test("keeps errors without details in their existing shape", () => {
  const response = toHttpError(
    new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT }),
  );

  assert.equal(response.status, 400);
  assert.equal("details" in response.body, false);
});

void test("maps a non-assignable Website to a stable client error", () => {
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.USER_WEBSITE_IDS_INVALID,
      details: {
        path: ["rbac", "websiteIds"],
        meta: { websiteId: "demo-instance", reason: "WEBSITE_NOT_ASSIGNABLE" },
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(response.body.code, ERROR_CODES.USER_WEBSITE_IDS_INVALID);
});

void test("keeps Zod errors on the existing validation-error path", () => {
  const parsed = FooterSettingsSchema.safeParse({
    copyright: "Compoz",
    showYear: "invalid",
  });

  assert.equal(parsed.success, false);

  if (parsed.success) return;

  const response = toHttpError(parsed.error);

  assert.equal(response.status, 400);
  assert.equal(response.body.code, ERROR_CODES.VALIDATION_ERROR);
  assert.equal(Array.isArray(response.body.issues), true);
});

void test("does not expose details for unrelated domain errors", () => {
  const response = toHttpError(
    new DomainError({
      code: ERROR_CODES.INVALID_ARGUMENT,
      details: {
        path: ["internal"],
        meta: { secret: "must-not-leak" },
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.equal("details" in response.body, false);
});
