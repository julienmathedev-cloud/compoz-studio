/**
 * @file apps/studio/src/features/pages/hooks/page-update-submission.test.ts
 * @layer studio/features/pages/hooks
 * @description Tests expected metadata conflict and unexpected update rejection outcomes.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import {
  shouldRunNormalPageUpdateSuccess,
  shouldApplyPageUpdateSuccessCleanup,
  submitPageUpdateMutation,
} from "@compoz/studio/features/pages/hooks/page-update-submission";

void test("metadata-only completion never runs the normal close or remount owner", () => {
  assert.equal(shouldRunNormalPageUpdateSuccess("normal"), true);
  assert.equal(shouldRunNormalPageUpdateSuccess("metadata-only"), false);
});

const DETAILS = {
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
      id: "page",
      parentId: null,
      slug: "remote",
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

const STRUCTURE_DETAILS = {
  expectedDraftStructureRevision: 7,
  currentDraftStructureRevision: 8,
  current: {
    index: {
      pages: [
        {
          id: "page",
          slug: "page",
          name: "Page",
          parentId: null,
          metaRevision: 3,
        },
      ],
      updatedAt: "2026-07-30T10:00:00.000Z",
    },
    draftStructureRevision: 8,
  },
} as const;

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

function structureConflict(): HttpError {
  return new HttpError(
    ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
    {
      status: 409,
      code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
      body: {
        error: {
          code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          details: STRUCTURE_DETAILS,
        },
      },
    },
  );
}

void test("metadata 409 resolves as an expected outcome and invokes its callback once", async () => {
  let conflictCalls = 0;
  let genericErrorCalls = 0;
  let outcome: Awaited<
    ReturnType<typeof submitPageUpdateMutation>
  > | null = null;

  await assert.doesNotReject(async () => {
    outcome = await submitPageUpdateMutation({
      mutate: () => Promise.reject(metadataConflict()),
      onMetadataConflict: () => {
        conflictCalls += 1;
      },
      onUnexpectedError: () => {
        genericErrorCalls += 1;
      },
    });
  });

  assert.equal(outcome, "metadataConflict");
  assert.equal(conflictCalls, 1);
  assert.equal(genericErrorCalls, 0);
  assert.equal(
    shouldApplyPageUpdateSuccessCleanup("metadataConflict"),
    false,
  );
});

void test("structure 409 resolves without rejection and invokes its callback once", async () => {
  const error = structureConflict();
  let structureConflictCalls = 0;
  let genericErrorCalls = 0;
  let outcome: Awaited<
    ReturnType<typeof submitPageUpdateMutation>
  > | null = null;

  await assert.doesNotReject(async () => {
    outcome = await submitPageUpdateMutation({
      mutate: () => Promise.reject(error),
      onStructureConflict: (details, receivedError) => {
        assert.deepEqual(details, STRUCTURE_DETAILS);
        assert.strictEqual(receivedError, error);
        structureConflictCalls += 1;
      },
      onUnexpectedError: () => {
        genericErrorCalls += 1;
      },
    });
  });

  assert.equal(outcome, "structureConflict");
  assert.equal(structureConflictCalls, 1);
  assert.equal(genericErrorCalls, 0);
  assert.equal(
    shouldApplyPageUpdateSuccessCleanup("structureConflict"),
    false,
  );
});

void test("successful mutation produces submitted and allows success cleanup", async () => {
  const outcome = await submitPageUpdateMutation({
    mutate: () => Promise.resolve({ response: { outcome: "updated" as const } }),
    onUnexpectedError: () => {
      assert.fail("unexpected error handler must not run");
    },
  });

  assert.equal(outcome, "submitted");
  assert.equal(shouldApplyPageUpdateSuccessCleanup(outcome), true);
  assert.equal(shouldApplyPageUpdateSuccessCleanup("noChanges"), true);
  assert.equal(shouldApplyPageUpdateSuccessCleanup("ignored"), false);
});

void test("server noChanges is propagated and remains a successful cleanup", async () => {
  const outcome = await submitPageUpdateMutation({
    mutate: () => Promise.resolve({ response: { outcome: "noChanges" as const } }),
    onUnexpectedError: () => assert.fail("unexpected error handler must not run"),
  });

  assert.equal(outcome, "noChanges");
  assert.equal(shouldApplyPageUpdateSuccessCleanup(outcome), true);
});

void test("unexpected errors keep the existing handler and rejected promise flow", async () => {
  const unexpected = new Error("unexpected");
  let conflictCalls = 0;
  let genericErrorCalls = 0;

  await assert.rejects(
    submitPageUpdateMutation({
      mutate: () => Promise.reject(unexpected),
      onMetadataConflict: () => {
        conflictCalls += 1;
      },
      onUnexpectedError: (error) => {
        assert.strictEqual(error, unexpected);
        genericErrorCalls += 1;
      },
    }),
    unexpected,
  );

  assert.equal(conflictCalls, 0);
  assert.equal(genericErrorCalls, 1);
});
