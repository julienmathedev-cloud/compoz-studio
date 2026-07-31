/**
 * @file apps/studio/src/app/api/pages/invalidate-page-mutation-status.test.ts
 * @layer studio/app/api/pages
 * @description Tests best-effort Page mutation cache invalidation semantics.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { invalidateUpdatedPageStatus } from "@compoz/studio/app/api/pages/invalidate-page-mutation-status";

void test("skips noChanges and invalidates an updated page exactly once", async () => {
  let calls = 0;
  const statusCache = { invalidateAll: async () => { calls += 1; return true; } };
  assert.equal(await invalidateUpdatedPageStatus({ websiteId: "website-a", outcome: "noChanges", statusCache, logger: {} }), true);
  assert.equal(await invalidateUpdatedPageStatus({ websiteId: "website-a", outcome: "updated", statusCache, logger: {} }), true);
  assert.equal(calls, 1);
});

for (const [name, invalidateAll] of [
  ["returns false", async () => false],
  ["rejects", async () => { throw new Error("unavailable"); }],
] as const) {
  void test(`logs and absorbs invalidation that ${name}`, async () => {
    const messages: string[] = [];
    const invalidated = await invalidateUpdatedPageStatus({
      websiteId: "website-a", outcome: "updated", statusCache: { invalidateAll },
      logger: { error: (message) => messages.push(message) },
    });
    assert.equal(invalidated, false);
    assert.deepEqual(messages, ["route.statusCache.invalidate.failed"]);
  });
}
