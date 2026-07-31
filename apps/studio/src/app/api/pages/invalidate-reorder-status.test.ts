/**
 * @file apps/studio/src/app/api/pages/invalidate-reorder-status.test.ts
 * @layer studio/app/api
 * @description Verifies post-commit invalidation cannot reject a successful reorder.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { invalidateCommittedReorderStatus } from "@compoz/studio/app/api/pages/[pageId]/children/reorder/invalidate-reorder-status";

function cache(invalidateAll: () => Promise<boolean>): SiteStatusCachePort {
  return {
    readStatusSnapshot: async () => null,
    putStatusSnapshot: async () => undefined,
    readStatusDetailsSnapshot: async () => null,
    putStatusDetailsSnapshot: async () => undefined,
    invalidateStatus: async () => true,
    invalidateStatusDetails: async () => true,
    invalidateAll,
  };
}

void test("a rejected post-commit invalidation is logged and resolves", async () => {
  const messages: string[] = [];
  const committed = { status: 200, draftStructureRevision: 7, outcome: "updated" as const };
  const returned = await invalidateCommittedReorderStatus({
      websiteId: "website-a",
      statusCache: cache(async () => { throw new Error("status unavailable"); }),
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
        statusCache: cache(async () => { invalidations += 1; return true; }),
        logger: {},
        commit: async () => {
          throw transactionError;
        },
      }),
    transactionError,
  );
  assert.equal(invalidations, 0);
});

void test("a committed noChanges reorder skips status invalidation", async () => {
  let invalidations = 0;
  const result = await invalidateCommittedReorderStatus({
    websiteId: "website-a",
    statusCache: cache(async () => { invalidations += 1; return true; }),
    logger: {},
    commit: async () => ({ outcome: "noChanges" as const }),
  });

  assert.equal(result.outcome, "noChanges");
  assert.equal(invalidations, 0);
});

void test("a committed reorder logs false invalidation and preserves its result", async () => {
  const messages: string[] = [];
  const result = await invalidateCommittedReorderStatus({
    websiteId: "website-a", statusCache: cache(async () => false),
    logger: { error: (message) => messages.push(message) },
    commit: async () => ({ outcome: "updated" as const }),
  });
  assert.equal(result.outcome, "updated");
  assert.deepEqual(messages, ["route.statusCache.invalidate.failed"]);
});
