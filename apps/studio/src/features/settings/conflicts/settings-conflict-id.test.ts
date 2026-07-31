/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-id.test.ts
 * @layer studio/features/settings/conflicts
 * @description Regression tests for the actual Settings OCC conflict identity generator.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { conflictItemDomIdentity } from "@compoz/studio/features/conflicts/conflict-focus";
import {
  SETTINGS_CONFLICT_SCOPES,
  settingsConflictId,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-id";

void test("primary and legal menus remain isolated with the same sequence, revision, and item id", () => {
  const primary = settingsConflictId("primary-menu", 1, 1);
  const legal = settingsConflictId("legal-menu", 1, 1);
  const primaryDom = conflictItemDomIdentity(primary, "items");
  const legalDom = conflictItemDomIdentity(legal, "items");

  assert.notEqual(primary, legal);
  assert.notEqual(primaryDom.radioName, legalDom.radioName);
  assert.notEqual(primaryDom.statusId, legalDom.statusId);
  assert.notEqual(primaryDom.firstChoiceToken, legalDom.firstChoiceToken);
});

void test("all eight stable Settings scopes produce unique locale-independent identities", () => {
  const ids = SETTINGS_CONFLICT_SCOPES.map((scope) => settingsConflictId(scope, 3, 12));
  assert.equal(SETTINGS_CONFLICT_SCOPES.length, 8);
  assert.equal(new Set(ids).size, SETTINGS_CONFLICT_SCOPES.length);
  assert.deepEqual(ids, [
    "settings-identity-3-12",
    "settings-header-3-12",
    "settings-footer-3-12",
    "settings-seo-3-12",
    "settings-theme-3-12",
    "settings-social-3-12",
    "settings-primary-menu-3-12",
    "settings-legal-menu-3-12",
  ]);
});
