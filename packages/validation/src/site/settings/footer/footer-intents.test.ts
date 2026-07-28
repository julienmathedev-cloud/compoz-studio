/**
 * @file packages/validation/src/site/settings/footer/footer-intents.test.ts
 * @layer validation/site/settings/footer
 * @description Tests the strict footer OCC HTTP intent boundary.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { UpdateFooterSettingsIntentSchema } from "@compoz/validation/site/settings/footer/footer-intents";

const VALID_INTENT = {
  baseline: { copyright: "Baseline", showYear: true },
  patch: { copyright: "Local" },
  expectedRevision: 2,
};

void test("accepts a complete baseline, partial patch, and integer revision", () => {
  assert.equal(
    UpdateFooterSettingsIntentSchema.safeParse(VALID_INTENT).success,
    true,
  );
});

void test("keeps an absent revision valid at the boundary for the domain precondition", () => {
  const { expectedRevision: _revision, ...withoutRevision } = VALID_INTENT;

  assert.equal(
    UpdateFooterSettingsIntentSchema.safeParse(withoutRevision).success,
    true,
  );
});

for (const expectedRevision of [-1, 1.5, "1", null]) {
  void test(`rejects invalid revision ${String(expectedRevision)}`, () => {
    assert.equal(
      UpdateFooterSettingsIntentSchema.safeParse({
        ...VALID_INTENT,
        expectedRevision,
      }).success,
      false,
    );
  });
}

void test("rejects unknown root, baseline, and patch properties", () => {
  assert.equal(
    UpdateFooterSettingsIntentSchema.safeParse({
      ...VALID_INTENT,
      extra: true,
    }).success,
    false,
  );
  assert.equal(
    UpdateFooterSettingsIntentSchema.safeParse({
      ...VALID_INTENT,
      baseline: { ...VALID_INTENT.baseline, extra: true },
    }).success,
    false,
  );
  assert.equal(
    UpdateFooterSettingsIntentSchema.safeParse({
      ...VALID_INTENT,
      patch: { ...VALID_INTENT.patch, extra: true },
    }).success,
    false,
  );
});
