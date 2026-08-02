/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-execution.test.ts
 * @layer studio/features/settings/conflicts
 * @description Tests the real injected effects used by the Settings OCC hook.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { executeSettingsConflictApply, executeSettingsCurrentAdoption } from "@compoz/studio/features/settings/conflicts/settings-conflict-execution";

type Values = Readonly<{ title: string }>;
const current = { value: { title: "Saved" }, revision: 9, adoptCache: () => void 0 };

void test("adopting current performs no mutation and rolls back partial effects on failure", async () => {
  let adoptedRevision = 0;
  let cacheWrites = 0;
  let commits = 0;
  let rollbacks = 0;
  const result = await executeSettingsCurrentAdoption({
    current: { ...current, adoptCache: () => { cacheWrites += 1; } },
    adoptSnapshot: (_value, revision) => { adoptedRevision = revision; return () => { rollbacks += 1; }; },
    commit: () => { commits += 1; },
  });
  assert.deepEqual(result, { status: "success" });
  assert.deepEqual({ adoptedRevision, cacheWrites, commits, rollbacks }, { adoptedRevision: 9, cacheWrites: 1, commits: 1, rollbacks: 0 });

  const failed = await executeSettingsCurrentAdoption({
    current: { ...current, adoptCache: () => { throw new Error("cache"); } },
    adoptSnapshot: () => () => { rollbacks += 1; },
    commit: () => { commits += 1; },
  });
  assert.deepEqual(failed, { status: "error" });
  assert.equal(rollbacks, 1);
});

void test("noChanges adopts locally without mutation", async () => {
  let mutations = 0;
  let cacheWrites = 0;
  let mutationCallbacks = 0;
  let committed: Values | null = null;
  const result = await executeSettingsConflictApply({
    plan: { status: "noChanges", value: current.value, baseline: current.value, expectedRevision: 9 },
    current: { ...current, adoptCache: () => { cacheWrites += 1; } },
    signal: new AbortController().signal,
    adoptSnapshot: (_value, revision) => { assert.equal(revision, 9); return () => void 0; },
    mutate: async () => { mutations += 1; return { value: { title: "Unexpected" }, outcome: "updated" }; },
    commit: (value) => { committed = value; },
    onMutationResult: (value, outcome) => {
      mutationCallbacks += 1;
      assert.deepEqual(value, current.value);
      assert.equal(outcome, "noChanges");
    },
  });
  assert.equal(result.status, "success");
  assert.deepEqual(
    { mutations, cacheWrites, mutationCallbacks, committed },
    { mutations: 0, cacheWrites: 1, mutationCallbacks: 1, committed: current.value },
  );
});

void test("mutation uses the semantic payload once and rolls the OCC snapshot back on error", async () => {
  const plan = { status: "mutation" as const, value: { title: "Local" }, baseline: current.value, expectedRevision: 9, payload: { title: "Local" }, fields: ["title"] };
  let mutations = 0;
  let rollbacks = 0;
  let committed: Values | null = null;
  const success = await executeSettingsConflictApply({
    plan,
    current,
    signal: new AbortController().signal,
    adoptSnapshot: (_value, revision) => { assert.equal(revision, plan.expectedRevision); return () => { rollbacks += 1; }; },
    mutate: async (payload) => { mutations += 1; assert.deepEqual(payload, { title: "Local" }); return { value: { title: "Persisted" }, outcome: "updated" }; },
    commit: (value) => { committed = value; },
    onMutationResult: () => undefined,
  });
  assert.equal(success.status, "success");
  assert.deepEqual({ mutations, rollbacks, committed }, { mutations: 1, rollbacks: 0, committed: { title: "Persisted" } });

  const conflict = new Error("second 409");
  const failed = await executeSettingsConflictApply({
    plan,
    current,
    signal: new AbortController().signal,
    adoptSnapshot: () => () => { rollbacks += 1; },
    mutate: async () => { mutations += 1; throw conflict; },
    commit: () => { throw new Error("must not commit"); },
    onMutationResult: () => undefined,
  });
  assert.equal(failed.status, "error");
  if (failed.status === "error") assert.equal(failed.error, conflict);
  assert.equal(mutations, 2);
  assert.equal(rollbacks, 1);
});
