/**
 * @file apps/studio/src/app/api/settings/invalidate-settings-status.test.ts
 * @layer studio/app/api/settings
 * @description Tests conditional best-effort status invalidation for settings mutations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { invalidateUpdatedSettingsStatus } from "@compoz/studio/app/api/settings/invalidate-settings-status";

void test("settings status invalidation runs only for updated and absorbs failures", async () => {
  let calls = 0;
  const errors: string[] = [];
  const statusCache = {
    readStatusSnapshot: async () => null,
    readStatusDetailsSnapshot: async () => null,
    putStatusSnapshot: async () => undefined,
    putStatusDetailsSnapshot: async () => undefined,
    invalidateStatus: async () => {
      calls += 1;
      throw new Error("cache unavailable");
    },
    invalidateStatusDetails: async () => true,
    invalidateAll: async () => true,
  };

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
  assert.deepEqual(errors, ["route.settings.invalidate.failed"]);
});
