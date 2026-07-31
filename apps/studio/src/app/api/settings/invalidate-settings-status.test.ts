/**
 * @file apps/studio/src/app/api/settings/invalidate-settings-status.test.ts
 * @layer studio/app/api/settings
 * @description Tests conditional best-effort status invalidation for settings mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { invalidateUpdatedSettingsStatus } from "@compoz/studio/app/api/settings/invalidate-settings-status";

function cache(invalidateStatus: () => Promise<boolean>) {
  return {
    readStatusSnapshot: async () => null,
    readStatusDetailsSnapshot: async () => null,
    putStatusSnapshot: async () => undefined,
    putStatusDetailsSnapshot: async () => undefined,
    invalidateStatus,
    invalidateStatusDetails: async () => true,
    invalidateAll: async () => true,
  };
}

void test("settings skips noChanges and succeeds when status invalidates", async () => {
  let calls = 0;
  const errors: string[] = [];
  const statusCache = cache(async () => { calls += 1; return true; });

  await invalidateUpdatedSettingsStatus({
    websiteId: "website-a",
    outcome: "noChanges",
    statusCache,
    logger: { error: (message) => errors.push(message) },
  });
  await invalidateUpdatedSettingsStatus({
    websiteId: "website-a",
    outcome: "updated",
    statusCache,
    logger: { error: (message) => errors.push(message) },
  });
  assert.equal(calls, 1);
  assert.deepEqual(errors, []);
});

for (const [name, invalidateStatus] of [
  ["returns false", async () => false],
  ["rejects", async () => { throw new Error("cache unavailable"); }],
] as const) {
  void test(`settings logs and absorbs an invalidation that ${name}`, async () => {
    const errors: string[] = [];
    const invalidated = await invalidateUpdatedSettingsStatus({
      websiteId: "website-a", outcome: "updated", statusCache: cache(invalidateStatus),
      logger: { error: (message) => errors.push(message) },
    });
    assert.equal(invalidated, false);
    assert.deepEqual(errors, ["route.settings.invalidate.failed"]);
  });
}
