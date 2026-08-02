/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-auto-rebase.test.ts
 * @layer studio/features/settings/conflicts
 * @description Tests deterministic Settings conflict classification and bounded automatic rebases.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { ConflictPresentationGroup, ConflictPresentationItem } from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  legalMenuConflictAdapter,
  primaryMenuConflictAdapter,
  socialConflictAdapter,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";
import {
  executeSettingsAutomaticRebase,
  isSettingsConflictAutomaticallyResolvable,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-auto-rebase";
import type { SettingsConflictPresentationAdapter } from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

const t = (key: string, values?: Record<string, string | number | Date>) =>
  values ? `${key}:${Object.values(values).join(":")}` : key;

function item(
  id: string,
  resolutionMode: ConflictPresentationItem["resolutionMode"],
): ConflictPresentationItem {
  return {
    id,
    label: id,
    status: resolutionMode === "choice" ? "conflict" : "local-only",
    resolutionMode,
  };
}

function groups(...items: ConflictPresentationItem[]): readonly ConflictPresentationGroup[] {
  return [{ id: "settings", items }];
}

void test("classifies empty and automatic-only groups as automatic", () => {
  assert.equal(isSettingsConflictAutomaticallyResolvable([]), true);
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups()), true);
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups(
    item("server", "automatic"),
    item("local", "automatic"),
    item("same", "automatic"),
  )), true);
});

void test("classifies choice, manual, and mixed groups as interactive", () => {
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups(item("choice", "choice"))), false);
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups(item("manual", "manual"))), false);
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups(
    item("automatic", "automatic"),
    item("choice", "choice"),
  )), false);
  assert.equal(isSettingsConflictAutomaticallyResolvable(groups(
    item("automatic", "automatic"),
    item("manual", "manual"),
  )), false);
});

type HarnessResult<T extends object> = Readonly<{
  result: Awaited<ReturnType<typeof executeSettingsAutomaticRebase<T>>>;
  fetches: number;
  mutations: number;
  cacheAdoptions: number;
  snapshotAdoptions: number;
  rollbacks: number;
  commits: readonly T[];
  callbacks: readonly Readonly<{ value: T; outcome: "updated" | "noChanges" }>[];
}>;

async function runRebase<T extends object>(input: Readonly<{
  baseline: T;
  current: T;
  local: T;
  adapter: SettingsConflictPresentationAdapter<T>;
  mutate?: (payload: Partial<T> | T) => Promise<Readonly<{ value: T; outcome: "updated" | "noChanges" }>>;
}>): Promise<HarnessResult<T>> {
  let fetches = 0;
  let mutations = 0;
  let cacheAdoptions = 0;
  let snapshotAdoptions = 0;
  let rollbacks = 0;
  const commits: T[] = [];
  const callbacks: Array<Readonly<{ value: T; outcome: "updated" | "noChanges" }>> = [];
  const result = await executeSettingsAutomaticRebase({
    baseline: input.baseline,
    local: input.local,
    signal: new AbortController().signal,
    fetchCurrent: async () => {
      fetches += 1;
      return {
        value: input.current,
        revision: 7,
        adoptCache: () => {
          cacheAdoptions += 1;
        },
      };
    },
    presentation: input.adapter,
    adoptSnapshot: (_value, revision) => {
      assert.equal(revision, 7);
      snapshotAdoptions += 1;
      return () => {
        rollbacks += 1;
      };
    },
    mutate: async (payload) => {
      mutations += 1;
      if (input.mutate) return input.mutate(payload);
      return { value: { ...input.current, ...payload }, outcome: "updated" } as const;
    },
    commit: (value) => {
      commits.push(value);
    },
    onMutationResult: (value, outcome) => {
      callbacks.push({ value, outcome });
    },
  });
  return {
    result,
    fetches,
    mutations,
    cacheAdoptions,
    snapshotAdoptions,
    rollbacks,
    commits,
    callbacks,
  };
}

type ScalarValues = Readonly<{ title: string; enabled: boolean }>;
const scalarAdapter: SettingsConflictPresentationAdapter<ScalarValues> = {
  labels: { title: "Title", enabled: "Enabled" },
  display: (_key, value) => ({ kind: "text", text: String(value) }),
};

void test("rebases distinct scalar fields with one read and one semantic mutation", async () => {
  const result = await runRebase({
    baseline: { title: "Initial", enabled: false },
    current: { title: "Initial", enabled: true },
    local: { title: "Local", enabled: false },
    adapter: scalarAdapter,
  });
  assert.equal(result.result.status, "resolved");
  if (result.result.status === "resolved") {
    assert.deepEqual(result.result.result, {
      status: "saved",
      value: { title: "Local", enabled: true },
      fields: ["title"],
    });
  }
  assert.deepEqual({
    fetches: result.fetches,
    mutations: result.mutations,
    snapshotAdoptions: result.snapshotAdoptions,
    commits: result.commits.length,
    callbacks: result.callbacks.length,
  }, { fetches: 1, mutations: 1, snapshotAdoptions: 1, commits: 1, callbacks: 1 });
});

void test("adopts the current snapshot as noChanges without a second mutation", async () => {
  const current = { title: "Shared", enabled: false };
  const result = await runRebase({
    baseline: { title: "Initial", enabled: false },
    current,
    local: current,
    adapter: scalarAdapter,
  });
  assert.equal(result.result.status, "resolved");
  if (result.result.status === "resolved") {
    assert.deepEqual(result.result.result, { status: "noChanges", value: current, fields: [] });
  }
  assert.deepEqual({
    mutations: result.mutations,
    cacheAdoptions: result.cacheAdoptions,
    commits: result.commits,
    callbacks: result.callbacks,
  }, {
    mutations: 0,
    cacheAdoptions: 1,
    commits: [current],
    callbacks: [{ value: current, outcome: "noChanges" }],
  });
});

void test("keeps divergent scalar values interactive without an automatic retry", async () => {
  const result = await runRebase({
    baseline: { title: "Initial", enabled: false },
    current: { title: "Server", enabled: false },
    local: { title: "Local", enabled: false },
    adapter: scalarAdapter,
  });
  assert.equal(result.result.status, "interactive");
  assert.equal(result.mutations, 0);
  if (result.result.status === "interactive") {
    assert.equal(result.result.groups[0]?.items[0]?.resolutionMode, "choice");
  }
});

void test("automatically merges Social distinct items, distinct properties, and compatible additions", async () => {
  const adapter = socialConflictAdapter(t);
  const original = { id: "base", kind: "website" as const, href: "https://before.example" };
  const second = { id: "second", kind: "github" as const, href: "https://second.example" };
  const cases: readonly Readonly<{
    baseline: SocialFormValues;
    current: SocialFormValues;
    local: SocialFormValues;
  }>[] = [
    {
      baseline: { items: [original, second] },
      current: { items: [{ ...original, kind: "linkedin" }, second] },
      local: { items: [original, { ...second, href: "https://local.example" }] },
    },
    {
      baseline: { items: [original] },
      current: { items: [{ ...original, kind: "linkedin" }] },
      local: { items: [{ ...original, href: "https://local.example" }] },
    },
    {
      baseline: { items: [original] },
      current: { items: [original, { id: "server", kind: "linkedin", href: "https://server.example" }] },
      local: { items: [original, { id: "local", kind: "github", href: "https://local.example" }] },
    },
  ];
  for (const values of cases) {
    const result = await runRebase({
      ...values,
      adapter,
    });
    assert.equal(result.result.status, "resolved");
    assert.equal(result.mutations, 1);
  }
});

void test("keeps Social property conflicts and deletion versus modification interactive", async () => {
  const adapter = socialConflictAdapter(t);
  const original = { id: "base", kind: "website" as const, href: "https://before.example" };
  const cases: readonly Readonly<{
    current: SocialFormValues;
    local: SocialFormValues;
  }>[] = [
    {
      current: { items: [{ ...original, href: "https://server.example" }] },
      local: { items: [{ ...original, href: "https://local.example" }] },
    },
    {
      current: { items: [] },
      local: { items: [{ ...original, href: "https://local.example" }] },
    },
  ];
  for (const values of cases) {
    const result = await runRebase({
      baseline: { items: [original] },
      ...values,
      adapter,
    });
    assert.equal(result.result.status, "interactive");
    assert.equal(result.mutations, 0);
  }
});

void test("automatically merges compatible Primary and Legal menu changes", async () => {
  const primaryBaseline: PrimaryMenuFormValues = { items: [
    { id: "a", label: "A", href: "/a", newTab: false, children: [] },
    { id: "b", label: "B", href: "/b", newTab: false, children: [] },
  ] };
  const primary = await runRebase({
    baseline: primaryBaseline,
    current: { items: [{ ...primaryBaseline.items[0]!, label: "Saved" }, primaryBaseline.items[1]!] },
    local: { items: [primaryBaseline.items[0]!, { ...primaryBaseline.items[1]!, href: "/local" }] },
    adapter: primaryMenuConflictAdapter(t),
  });
  assert.equal(primary.result.status, "resolved");

  const samePrimaryItem = await runRebase({
    baseline: primaryBaseline,
    current: { items: [{ ...primaryBaseline.items[0]!, label: "Saved" }, primaryBaseline.items[1]!] },
    local: { items: [{ ...primaryBaseline.items[0]!, href: "/local" }, primaryBaseline.items[1]!] },
    adapter: primaryMenuConflictAdapter(t),
  });
  assert.equal(samePrimaryItem.result.status, "resolved");

  const legalBaseline: LegalMenuFormValues = { items: [
    { id: "legal", label: "Legal", href: "/legal", newTab: false },
  ] };
  const legal = await runRebase({
    baseline: legalBaseline,
    current: { items: [...legalBaseline.items, { id: "server", label: "Server", href: "/server", newTab: false }] },
    local: { items: [...legalBaseline.items, { id: "local", label: "Local", href: "/local", newTab: false }] },
    adapter: legalMenuConflictAdapter(t),
  });
  assert.equal(legal.result.status, "resolved");
});

void test("keeps incompatible menu order interactive", async () => {
  const baseline: LegalMenuFormValues = { items: [
    { id: "a", label: "A", href: "/a", newTab: false },
    { id: "b", label: "B", href: "/b", newTab: false },
    { id: "c", label: "C", href: "/c", newTab: false },
  ] };
  const result = await runRebase({
    baseline,
    current: { items: [baseline.items[1]!, baseline.items[0]!, baseline.items[2]!] },
    local: { items: [baseline.items[0]!, baseline.items[2]!, baseline.items[1]!] },
    adapter: legalMenuConflictAdapter(t),
  });
  assert.equal(result.result.status, "interactive");
  assert.equal(result.mutations, 0);
});

void test("bounds an automatic rebase to one mutation when that mutation conflicts", async () => {
  const secondConflict = new Error("second conflict");
  const result = await runRebase({
    baseline: { title: "Initial", enabled: false },
    current: { title: "Initial", enabled: true },
    local: { title: "Local", enabled: false },
    adapter: scalarAdapter,
    mutate: async () => {
      throw secondConflict;
    },
  });
  assert.equal(result.result.status, "retryFailed");
  if (result.result.status === "retryFailed") {
    assert.equal(result.result.error, secondConflict);
    assert.deepEqual(result.result.plan.value, { title: "Local", enabled: true });
  }
  assert.deepEqual({
    fetches: result.fetches,
    mutations: result.mutations,
    rollbacks: result.rollbacks,
    commits: result.commits.length,
    callbacks: result.callbacks.length,
  }, { fetches: 1, mutations: 1, rollbacks: 1, commits: 0, callbacks: 0 });
});
