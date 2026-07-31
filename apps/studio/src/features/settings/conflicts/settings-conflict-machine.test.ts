/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-machine.test.ts
 * @layer studio/features/settings/conflicts
 * @description Tests the actual pure state machine consumed by useSettingsResource.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  isSettingsConflictPending,
  transitionSettingsConflict,
  type SettingsConflictMachineState,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-machine";

type Values = Readonly<{ title: string }>;
const baseline = { title: "Initial" };
const local = { title: "Local" };
const fresh = { value: { title: "Saved" }, revision: 9, adoptCache: () => void 0 };

function opened(): SettingsConflictMachineState<Values> {
  return transitionSettingsConflict({ phase: "idle" }, { type: "open", conflictId: "settings-1", baseline, local });
}

void test("409 preserves baseline and local while starting one fresh read", () => {
  const state = opened();
  assert.equal(state.phase, "loadingCurrent");
  assert.deepEqual(state.baseline, baseline);
  assert.deepEqual(state.local, local);
  assert.equal(isSettingsConflictPending(state), true);
  assert.equal(transitionSettingsConflict(state, { type: "startApply" }), state);
});

void test("fresh read success, failure, and explicit retry have typed transitions", () => {
  const ready = transitionSettingsConflict(opened(), { type: "freshReadSucceeded", current: fresh });
  assert.equal(ready.phase, "ready");
  const failed = transitionSettingsConflict(opened(), { type: "freshReadFailed", error: "Fresh read failed" });
  assert.equal(failed.phase, "freshReadError");
  const retry = transitionSettingsConflict(failed, { type: "startFreshRead" });
  assert.equal(retry.phase, "loadingCurrent");
});

void test("abandon closes only when no action is pending", () => {
  assert.equal(transitionSettingsConflict(opened(), { type: "abandon" }).phase, "loadingCurrent");
  const ready = transitionSettingsConflict(opened(), { type: "freshReadSucceeded", current: fresh });
  assert.deepEqual(transitionSettingsConflict(ready, { type: "abandon" }), { phase: "idle" });
});

void test("adoption and apply serialize actions and close only on completion", () => {
  const ready = transitionSettingsConflict(opened(), { type: "freshReadSucceeded", current: fresh });
  const adopting = transitionSettingsConflict(ready, { type: "startAdoptingCurrent" });
  assert.equal(adopting.phase, "adoptingCurrent");
  assert.equal(transitionSettingsConflict(adopting, { type: "startApply" }), adopting);
  assert.deepEqual(transitionSettingsConflict(adopting, { type: "complete" }), { phase: "idle" });

  const applying = transitionSettingsConflict(ready, { type: "startApply" });
  assert.equal(applying.phase, "applying");
  assert.equal(transitionSettingsConflict(applying, { type: "startApply" }), applying);
  assert.equal(transitionSettingsConflict(applying, { type: "startAdoptingCurrent" }), applying);
  assert.equal(transitionSettingsConflict(applying, { type: "abandon" }), applying);
});

void test("mutation error preserves choices and allows a new explicit attempt", () => {
  const ready = transitionSettingsConflict(opened(), { type: "freshReadSucceeded", current: fresh });
  const chosen = transitionSettingsConflict(ready, { type: "choose", itemId: "title", choice: "local" });
  const applying = transitionSettingsConflict(chosen, { type: "startApply" });
  const failed = transitionSettingsConflict(applying, { type: "mutationFailed", error: "Mutation failed" });
  assert.equal(failed.phase, "mutationError");
  assert.equal(failed.choices.title, "local");
  assert.equal(transitionSettingsConflict(failed, { type: "startApply" }).phase, "applying");
});

void test("second 409 waits for an explicit fresh read and never restarts apply", () => {
  const ready = transitionSettingsConflict(opened(), { type: "freshReadSucceeded", current: fresh });
  const applying = transitionSettingsConflict(ready, { type: "startApply" });
  const second = transitionSettingsConflict(applying, { type: "secondConflict", baseline: fresh.value, local, error: "Conflict again" });
  assert.equal(second.phase, "secondConflict");
  assert.equal(isSettingsConflictPending(second), false);
  assert.equal(transitionSettingsConflict(second, { type: "startApply" }), second);
  assert.equal(transitionSettingsConflict(second, { type: "startFreshRead" }).phase, "loadingCurrent");
});
