/**
 * @file apps/studio/src/features/settings/hooks/settings-load-deduplication.test.ts
 * @layer studio/features/settings/hooks
 * @description Unit tests for Settings load deduplication across aborted effects.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  canReuseSettingsLoad,
  type InFlightSettingsLoad,
} from "@compoz/studio/features/settings/hooks/settings-load-deduplication";

function createInFlightLoad(
  state: "draft" | "published" = "draft",
): InFlightSettingsLoad<string> {
  return {
    state,
    promise: Promise.resolve("loaded"),
    ctrl: new AbortController(),
  };
}

void test("does not reuse when there is no in-flight load", () => {
  assert.equal(canReuseSettingsLoad(null, "draft"), false);
});

void test("reuses an active same-state load", () => {
  assert.equal(canReuseSettingsLoad(createInFlightLoad(), "draft"), true);
});

void test("does not reuse an aborted same-state load", () => {
  const inFlight = createInFlightLoad();
  inFlight.ctrl.abort();

  assert.equal(canReuseSettingsLoad(inFlight, "draft"), false);
});

void test("does not reuse an active load for a different state", () => {
  assert.equal(canReuseSettingsLoad(createInFlightLoad(), "published"), false);
});

void test("does not reuse a same-state load aborted by effect cleanup", () => {
  const inFlight = createInFlightLoad();

  assert.equal(canReuseSettingsLoad(inFlight, "draft"), true);

  inFlight.ctrl.abort();

  assert.equal(canReuseSettingsLoad(inFlight, "draft"), false);
});
