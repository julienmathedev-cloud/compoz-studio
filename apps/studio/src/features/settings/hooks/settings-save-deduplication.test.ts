/**
 * @file apps/studio/src/features/settings/hooks/settings-save-deduplication.test.ts
 * @layer studio/features/settings/hooks
 * @description Tests that concurrent Settings saves share one bounded execution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { SettingsSaveDeduplicator } from "@compoz/studio/features/settings/hooks/settings-save-deduplication";

void test("concurrent saves reuse one promise and a later save starts normally", async () => {
  const deduplicator = new SettingsSaveDeduplicator<number>();
  let starts = 0;
  let release: ((value: number) => void) | undefined;
  const start = () => {
    starts += 1;
    return new Promise<number>((resolve) => {
      release = resolve;
    });
  };

  const first = deduplicator.run(start);
  const concurrent = deduplicator.run(start);
  assert.equal(concurrent, first);
  assert.equal(starts, 1);

  release?.(1);
  assert.equal(await first, 1);
  await Promise.resolve();

  const later = deduplicator.run(async () => {
    starts += 1;
    return 2;
  });
  assert.equal(await later, 2);
  assert.equal(starts, 2);
});
