/**
 * @file apps/studio/src/features/conflicts/occ-notifications.test.ts
 * @layer studio/features/conflicts
 * @description Tests OCC automatic-merge revision classification.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { isAutomaticRevisionMerge } from "@compoz/studio/features/conflicts/occ-notifications";

void test("final revision expected plus one remains a normal save", () => {
  assert.equal(isAutomaticRevisionMerge(4, 5), false);
});

void test("a final revision above expected plus one is an automatic merge", () => {
  assert.equal(isAutomaticRevisionMerge(4, 6), true);
  assert.equal(isAutomaticRevisionMerge(4, 7), true);
});
