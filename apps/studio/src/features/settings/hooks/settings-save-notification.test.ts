/**
 * @file apps/studio/src/features/settings/hooks/settings-save-notification.test.ts
 * @layer studio/features/settings/hooks
 * @description Tests semantic Settings save notification selection.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AUTOMATIC_MERGE_NOTIFICATION,
  settingsSaveNotificationFor,
} from "@compoz/studio/features/settings/hooks/settings-save-notification";

const resourceSource = readFileSync(
  new URL("./useSettingsResource.ts", import.meta.url),
  "utf8",
);
const presetsSource = readFileSync(
  new URL("../../../lib/ui/notify-presets.ts", import.meta.url),
  "utf8",
);

void test("automatic Settings merges select only the automatic merge notification", () => {
  assert.deepEqual(settingsSaveNotificationFor({
    status: "saved",
    fields: ["title"],
    notification: AUTOMATIC_MERGE_NOTIFICATION,
  }), { kind: "automaticMerge" });
  assert.deepEqual(settingsSaveNotificationFor({
    status: "noChanges",
    fields: [],
    notification: AUTOMATIC_MERGE_NOTIFICATION,
  }), { kind: "automaticMerge" });
});

void test("normal Settings saves preserve updated and noChanges notifications", () => {
  assert.deepEqual(settingsSaveNotificationFor({
    status: "saved",
    fields: ["title", "enabled"],
  }), { kind: "updated", fields: ["title", "enabled"] });
  assert.deepEqual(settingsSaveNotificationFor({
    status: "noChanges",
    fields: [],
  }), { kind: "noChanges" });
  assert.equal(settingsSaveNotificationFor({ status: "conflict" }), null);
});

void test("the automatic Settings notification is one info toast before outcome branches", () => {
  const automaticBranch = resourceSource.indexOf(
    'notification?.kind === "automaticMerge"',
  );
  const noChangesBranch = resourceSource.indexOf(
    'notification?.kind === "noChanges"',
  );
  const updatedBranch = resourceSource.indexOf(
    'notification?.kind === "updated"',
  );

  assert.ok(automaticBranch >= 0);
  assert.ok(noChangesBranch > automaticBranch);
  assert.ok(updatedBranch > noChangesBranch);
  assert.match(
    presetsSource,
    /function notifyAutomaticMerge\([\s\S]*notify\.info\(title, description\)/u,
  );
});
