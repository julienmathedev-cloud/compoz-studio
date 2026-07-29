/**
 * @file apps/studio/src/app/api/pages/invalidate-reorder-status.test.ts
 * @layer studio/app/api
 * @description Verifies post-commit invalidation cannot reject a successful reorder.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { invalidateCommittedReorderStatus } from "@compoz/studio/app/api/pages/[pageId]/children/reorder/invalidate-reorder-status";

function cache(
  invalidateStatus: () => Promise<boolean>,
  invalidateStatusDetails: () => Promise<boolean>,
): SiteStatusCachePort {
  return {
    readStatusSnapshot: async () => null,
    putStatusSnapshot: async () => undefined,
    readStatusDetailsSnapshot: async () => null,
    putStatusDetailsSnapshot: async () => undefined,
    invalidateStatus,
    invalidateStatusDetails,
    invalidateAll: async () => true,
  };
}

void test("a rejected post-commit invalidation is logged and resolves", async () => {
  const messages: string[] = [];
  const committed = { status: 200, draftStructureRevision: 7 };
  const returned = await invalidateCommittedReorderStatus({
      websiteId: "website-a",
      statusCache: cache(
        async () => {
          throw new Error("status unavailable");
        },
        async () => true,
      ),
      logger: {
        error: (message) => {
          messages.push(message);
        },
      },
      commit: async () => committed,
    });
  assert.strictEqual(returned, committed);
  assert.deepEqual(messages, ["route.statusCache.invalidate.failed"]);
});

void test("a rejected transaction remains rejected and skips invalidation", async () => {
  const transactionError = new Error("transaction failed");
  let invalidations = 0;

  await assert.rejects(
    () =>
      invalidateCommittedReorderStatus({
        websiteId: "website-a",
        statusCache: cache(
          async () => {
            invalidations += 1;
            return true;
          },
          async () => {
            invalidations += 1;
            return true;
          },
        ),
        logger: {},
        commit: async () => {
          throw transactionError;
        },
      }),
    transactionError,
  );
  assert.equal(invalidations, 0);
});
