/**
 * @file apps/studio/src/app/api/_adapters/footer.test.ts
 * @layer studio/app/api/adapters
 * @description Tests footer OCC intent normalization at the Studio boundary.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { adaptUpdateFooterIntent } from "@compoz/studio/app/api/_adapters/footer";

void test("normalizes baseline and present copyright patch without inventing fields", () => {
  const input = adaptUpdateFooterIntent({
    baseline: { copyright: "  Baseline  ", showYear: true },
    patch: { copyright: "  Local  " },
    expectedRevision: 3,
  });

  assert.deepEqual(input, {
    baseline: { copyright: "Baseline", showYear: true },
    patch: { copyright: "Local" },
    expectedRevision: 3,
  });
  assert.equal("showYear" in input.patch, false);
});
