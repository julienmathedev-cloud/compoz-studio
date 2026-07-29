/**
 * @file apps/studio/src/app/api/site/publish/invalidate-publish-status-cache.test.ts
 * @layer studio/app/api
 * @description Tests cache invalidation only runs after a committed publication.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { PublishSiteResult } from "@compoz/core/domain/site/use-cases/publish/publish-site.types";
import { publishAndInvalidateStatusCache } from "@compoz/studio/app/api/site/publish/invalidate-publish-status-cache";

const committedResult: PublishSiteResult = {
  pagesCopied: 1,
  settingsCopied: true,
  warnings: [],
  from: "draft",
  to: "published",
};

void test("invalidates exactly once after an internally retried publication succeeds", async () => {
  let publishCalls = 0;
  let internalAttempts = 0;
  let invalidationCalls = 0;
  const outcome = await publishAndInvalidateStatusCache({
    websiteId: "website-1",
    publish: async () => {
      publishCalls += 1;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        internalAttempts += 1;
      }

      return committedResult;
    },
    statusCache: {
      async invalidateAll() {
        invalidationCalls += 1;
        return true;
      },
    },
    logger: {
      debug: () => undefined,
      error: () => undefined,
    },
  });

  assert.equal(publishCalls, 1);
  assert.equal(internalAttempts, 2);
  assert.equal(invalidationCalls, 1);
  assert.equal(outcome.cacheInvalidated, true);
  assert.equal(outcome.result, committedResult);
});

void test("does not invalidate when publication exhausts its retries", async () => {
  const publicationError = new DomainError({
    code: ERROR_CODES.PUBLISH_CONFLICT,
  });
  let internalAttempts = 0;
  let invalidationCalls = 0;

  await assert.rejects(publishAndInvalidateStatusCache({
    websiteId: "website-1",
    publish: async (): Promise<PublishSiteResult> => {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        internalAttempts += 1;
      }

      throw publicationError;
    },
    statusCache: {
      async invalidateAll() {
        invalidationCalls += 1;
        return true;
      },
    },
    logger: {
      debug: () => undefined,
      error: () => undefined,
    },
  }), (error) => {
    assert.equal(error, publicationError);
    return true;
  });

  assert.equal(internalAttempts, 3);
  assert.equal(invalidationCalls, 0);
});

void test("adds one warning when cache invalidation returns false", async () => {
  let invalidationCalls = 0;
  const outcome = await publishAndInvalidateStatusCache({
    websiteId: "website-1",
    publish: async () => committedResult,
    statusCache: {
      async invalidateAll() {
        invalidationCalls += 1;
        return false;
      },
    },
    logger: {
      debug: () => undefined,
      error: () => undefined,
    },
  });

  assert.equal(invalidationCalls, 1);
  assert.equal(outcome.cacheInvalidated, false);
  assert.equal(outcome.result.pagesCopied, committedResult.pagesCopied);
  assert.equal(outcome.result.settingsCopied, committedResult.settingsCopied);
  assert.deepEqual(outcome.result.warnings, [
    {
      code: ERROR_CODES.PUBLISH_STATUS_CACHE_INVALIDATION_FAILED,
      path: ["studio", "statusCache"],
    },
  ]);
});

void test("absorbs cache invalidation failures without serializing the error", async () => {
  let invalidationCalls = 0;
  let loggerErrorCalls = 0;
  const outcome = await publishAndInvalidateStatusCache({
    websiteId: "website-1",
    publish: async () => committedResult,
    statusCache: {
      async invalidateAll() {
        invalidationCalls += 1;
        throw new Error("cache unavailable");
      },
    },
    logger: {
      debug: () => undefined,
      error: () => {
        loggerErrorCalls += 1;
      },
    },
  });

  assert.equal(invalidationCalls, 1);
  assert.equal(loggerErrorCalls, 1);
  assert.equal(outcome.cacheInvalidated, false);
  assert.equal(outcome.result.warnings.length, 1);
  assert.equal(
    outcome.result.warnings[0]?.code,
    ERROR_CODES.PUBLISH_STATUS_CACHE_INVALIDATION_FAILED,
  );
});
