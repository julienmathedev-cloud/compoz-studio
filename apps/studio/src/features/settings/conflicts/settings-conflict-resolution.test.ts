/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-resolution.test.ts
 * @layer studio/features/settings/conflicts
 * @description Tests settings OCC resolutions always compare and replay from current.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { toDecisionConflictGroups } from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  buildSemanticSettingsPatch,
  buildSettingsConflictMutationPlan,
  resolveSettingsConflictValues,
  toSettingsConflictPresentation,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";

type Values = Readonly<{ name: string; enabled: boolean }>;
const snapshot: Readonly<{ baseline: Values; current: Values; local: Values; currentRevision: number }> = {
  baseline: { name: "A", enabled: false },
  current: { name: "B", enabled: false },
  local: { name: "C", enabled: true },
  currentRevision: 4,
};
const fields = {
  labels: { name: "Name", enabled: "Enabled" },
  display: (_key: keyof Values, value: Values[keyof Values]) => ({ kind: "text" as const, text: String(value) }),
};

void test("keeps automatic changes and applies explicit local choices over current", () => {
  const result = resolveSettingsConflictValues({ snapshot, choices: { name: "local" } });
  assert.deepEqual(result, { status: "resolved", value: { name: "C", enabled: true } });
});

void test("refuses one or several unresolved conflicts instead of silently keeping current", () => {
  assert.deepEqual(
    resolveSettingsConflictValues({ snapshot, choices: {} }),
    { status: "incomplete", missingKeys: ["name"] },
  );
  const several = {
    baseline: { first: "A", second: "A" },
    current: { first: "B", second: "B" },
    local: { first: "C", second: "C" },
    currentRevision: 8,
  };
  assert.deepEqual(
    resolveSettingsConflictValues({ snapshot: several, choices: {} }),
    { status: "incomplete", missingKeys: ["first", "second"] },
  );
});

void test("applies explicit server and local choices while preserving automatic statuses", () => {
  assert.deepEqual(
    resolveSettingsConflictValues({ snapshot, choices: { name: "server" } }),
    { status: "resolved", value: { name: "B", enabled: true } },
  );
  assert.deepEqual(
    resolveSettingsConflictValues({ snapshot, choices: { name: "local" } }),
    { status: "resolved", value: { name: "C", enabled: true } },
  );
});

void test("shows two scalar decisions while keeping server-only and local-only values in the minimal plan", () => {
  type MixedValues = Readonly<{
    siteName: string;
    tagline: string;
    logo: string;
    localNote: string;
  }>;
  const mixedSnapshot = {
    baseline: { siteName: "Base", tagline: "Base", logo: "base.svg", localNote: "Base" },
    current: { siteName: "Saved name", tagline: "Saved tagline", logo: "saved.svg", localNote: "Base" },
    local: { siteName: "Local name", tagline: "Local tagline", logo: "base.svg", localNote: "Local note" },
    currentRevision: 9,
  } satisfies Readonly<{
    baseline: MixedValues;
    current: MixedValues;
    local: MixedValues;
    currentRevision: number;
  }>;
  const mixedFields = {
    labels: {
      siteName: "Site name",
      tagline: "Tagline",
      logo: "Logo",
      localNote: "Local note",
    },
    display: (_key: keyof MixedValues, value: MixedValues[keyof MixedValues]) => ({
      kind: "text" as const,
      text: value,
    }),
  };
  const completeGroups = toSettingsConflictPresentation({
    snapshot: mixedSnapshot,
    ...mixedFields,
  });
  const visibleGroups = toDecisionConflictGroups(completeGroups);

  assert.deepEqual(completeGroups[0]?.items.map((item) => [item.id, item.status]), [
    ["siteName", "conflict"],
    ["tagline", "conflict"],
    ["logo", "server-only"],
    ["localNote", "local-only"],
  ]);
  assert.deepEqual(visibleGroups[0]?.items.map((item) => item.id), [
    "siteName",
    "tagline",
  ]);

  const plan = buildSettingsConflictMutationPlan({
    snapshot: mixedSnapshot,
    choices: { siteName: "server", tagline: "local" },
    fields: mixedFields,
  });
  assert.equal(plan.status, "mutation");
  if (plan.status === "mutation") {
    assert.deepEqual(plan.value, {
      siteName: "Saved name",
      tagline: "Local tagline",
      logo: "saved.svg",
      localNote: "Local note",
    });
    assert.deepEqual(plan.payload, {
      tagline: "Local tagline",
      localNote: "Local note",
    });
  }
});

void test("resolves server-only, local-only, and same-change fields automatically", () => {
  const automatic = {
    baseline: { serverOnly: "A", localOnly: "A", same: "A" },
    current: { serverOnly: "B", localOnly: "A", same: "B" },
    local: { serverOnly: "A", localOnly: "B", same: "B" },
    currentRevision: 6,
  };
  assert.deepEqual(resolveSettingsConflictValues({ snapshot: automatic, choices: {} }), {
    status: "resolved",
    value: { serverOnly: "B", localOnly: "B", same: "B" },
  });
});

void test("preserves a local optional field when the current snapshot omits it", () => {
  type OptionalValues = Readonly<{ title: string; description?: string }>;
  const optionalSnapshot = {
    baseline: { title: "A" } satisfies OptionalValues,
    current: { title: "A" } satisfies OptionalValues,
    local: { title: "A", description: "Local description" } satisfies OptionalValues,
    currentRevision: 7,
  };

  assert.deepEqual(
    resolveSettingsConflictValues({ snapshot: optionalSnapshot, choices: {} }),
    {
      status: "resolved",
      value: { title: "A", description: "Local description" },
    },
  );
});

void test("plans resolution from current with currentRevision and skips an empty patch", () => {
  const mutation = buildSettingsConflictMutationPlan({
    snapshot,
    choices: { name: "local" },
    fields,
  });
  assert.equal(mutation.status, "mutation");
  if (mutation.status === "mutation") {
    assert.equal(mutation.expectedRevision, 4);
    assert.deepEqual(mutation.baseline, snapshot.current);
    assert.deepEqual(mutation.payload, { name: "C", enabled: true });
  }

  const noChanges = buildSettingsConflictMutationPlan({
    snapshot: { ...snapshot, local: { name: "C", enabled: false } },
    choices: { name: "server" },
    fields,
  });
  assert.equal(noChanges.status, "noChanges");
  if (noChanges.status === "noChanges") {
    assert.equal(noChanges.expectedRevision, 4);
    assert.deepEqual(noChanges.baseline, snapshot.current);
  }
});

void test("builds a minimal semantic patch for recreated composites and deletions", () => {
  type CompositeValues = Readonly<{
    title: string;
    object: Readonly<{ color: string }>;
    items: readonly string[];
    optional?: string;
  }>;
  const compositeFields = {
    labels: { title: "Title", object: "Object", items: "Items", optional: "Optional" },
    display: (_key: keyof CompositeValues, value: CompositeValues[keyof CompositeValues]) => ({ kind: "text" as const, text: String(value) }),
  };
  const current: CompositeValues = { title: "A", object: { color: "red" }, items: ["a", "b"], optional: "remove" };

  assert.deepEqual(buildSemanticSettingsPatch({
    current,
    resolved: { title: "A", object: { color: "red" }, items: ["a", "b"], optional: "remove" },
    fields: compositeFields,
  }), {});
  assert.deepEqual(buildSemanticSettingsPatch({
    current,
    resolved: { title: "B", object: { color: "red" }, items: ["a", "b"], optional: "remove" },
    fields: compositeFields,
  }), { title: "B" });
  assert.deepEqual(buildSemanticSettingsPatch({
    current,
    resolved: { title: "A", object: { color: "blue" }, items: ["a", "b"], optional: "remove" },
    fields: compositeFields,
  }), { object: { color: "blue" } });
  assert.deepEqual(buildSemanticSettingsPatch({
    current,
    resolved: { title: "A", object: { color: "red" }, items: ["b", "a"], optional: "remove" },
    fields: compositeFields,
  }), { items: ["b", "a"] });
  assert.deepEqual(buildSemanticSettingsPatch({
    current,
    resolved: { title: "A", object: { color: "red" }, items: ["a", "b"] },
    fields: compositeFields,
  }), { optional: undefined });
  assert.deepEqual(buildSemanticSettingsPatch({
    current: { title: "A", object: { color: "red" }, items: [] },
    resolved: { title: "A", object: { color: "red" }, items: [] },
    fields: compositeFields,
  }), {});
});

void test("same-change recreated composites produce a noChanges plan", () => {
  type Composite = Readonly<{ settings: Readonly<{ color: string }>; items: readonly string[] }>;
  const compositeSnapshot = {
    baseline: { settings: { color: "red" }, items: ["a"] },
    current: { settings: { color: "blue" }, items: ["a", "b"] },
    local: { settings: { color: "blue" }, items: ["a", "b"] },
    currentRevision: 12,
  } satisfies Readonly<{ baseline: Composite; current: Composite; local: Composite; currentRevision: number }>;
  const plan = buildSettingsConflictMutationPlan({
    snapshot: compositeSnapshot,
    choices: {},
    fields: {
      labels: { settings: "Settings", items: "Items" },
      display: (_key, value) => ({ kind: "text", text: String(value) }),
    },
  });
  assert.equal(plan.status, "noChanges");
  if (plan.status === "noChanges") assert.equal(plan.expectedRevision, 12);
});

void test("only conflict values require a choice", () => {
  const groups = toSettingsConflictPresentation({
    snapshot,
    labels: { name: "Name", enabled: "Enabled" },
    display: (_key, value) => ({ kind: "text" as const, text: String(value) }),
  });
  assert.equal(groups[0]?.items.find((item) => item.id === "name")?.resolutionMode, "choice");
  assert.equal(groups[0]?.items.find((item) => item.id === "enabled")?.resolutionMode, "automatic");
});

void test("compares normalized composite values structurally while retaining array order", () => {
  assert.equal(equalJsonValue({ logo: { src: "/logo.png" } }, { logo: { src: "/logo.png" } }), true);
  assert.equal(equalJsonValue(["a", "b"], ["a", "b"]), true);
  assert.equal(equalJsonValue(["a", "b"], ["b", "a"]), false);
  assert.equal(equalJsonValue({ value: undefined }, {}), false);
  assert.equal(equalJsonValue(null, null), true);
});

void test("does not turn equal recreated settings objects into conflicts", () => {
  const values = {
    baseline: { logo: { src: "/logo.png" } },
    current: { logo: { src: "/logo.png" } },
    local: { logo: { src: "/logo.png" } },
    currentRevision: 4,
  };
  const groups = toSettingsConflictPresentation({
    snapshot: values,
    labels: { logo: "Logo" },
    display: () => ({ kind: "text" as const, text: "Logo" }),
  });
  assert.deepEqual(groups[0]?.items, []);
});

void test("passes the field key to settings formatters and equality semantics", () => {
  const values = {
    baseline: { title: "A", theme: { primary: "red" }, items: ["a"] },
    current: { title: "B", theme: { primary: "red" }, items: ["b"] },
    local: { title: "A", theme: { primary: "red" }, items: ["c"] },
    currentRevision: 5,
  };
  const seen: string[] = [];
  const groups = toSettingsConflictPresentation({
    snapshot: values,
    labels: { title: "Title", theme: "Theme", items: "Items" },
    display: (key, value) => {
      seen.push(String(key));
      return { kind: "text", text: `${String(key)}:${JSON.stringify(value)}` };
    },
  });
  assert.deepEqual(groups[0]?.items.map((item) => item.label), ["Title", "Items"]);
  assert.ok(seen.includes("title"));
  assert.ok(seen.includes("items"));
  assert.ok(!seen.includes("theme"));
});
