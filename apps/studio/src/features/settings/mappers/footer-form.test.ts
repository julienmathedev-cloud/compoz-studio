/**
 * @file apps/studio/src/features/settings/mappers/footer-form.test.ts
 * @layer studio/features/settings/mappers
 * @description Tests construction of the footer OCC update intent.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { toUpdateFooterIntentDTOFromFormValues } from "@compoz/studio/features/settings/mappers/footer-form";

void test("builds a complete normalized baseline and preserves partial patch semantics", () => {
  const intent = toUpdateFooterIntentDTOFromFormValues(
    { copyright: "  Baseline  ", showYear: true },
    { copyright: "  Local  " },
    4,
  );

  assert.deepEqual(intent, {
    baseline: { copyright: "Baseline", showYear: true },
    patch: { copyright: "Local" },
    expectedRevision: 4,
  });
  assert.equal("showYear" in intent.patch, false);
});
