/**
 * @file apps/studio/src/features/settings/conflicts/settings-list-resolution.test.ts
 * @layer studio/features/settings/conflicts
 * @description Three-way list resolution tests through the actual Social and menu field strategies.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { ConflictPresentationItem } from "@compoz/studio/features/conflicts/conflict-presentation";
import { toDecisionConflictGroups } from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  legalMenuConflictAdapter,
  primaryMenuConflictAdapter,
  socialConflictAdapter,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";
import { buildSettingsConflictMutationPlan } from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

const t = (key: string, values?: Record<string, string | number | Date>) =>
  values ? `${key}:${Object.values(values).join(":")}` : key;

function visiblePresentation(items: readonly Readonly<{ id: string; label: string; context?: string; comparison?: unknown; orderComparison?: unknown; details?: unknown }>[]): string {
  return JSON.stringify(items.map(({ label, context, comparison, details }) => ({ label, context, comparison, details })));
}

void test("Social combines independent additions and independent properties by item ID", () => {
  const strategy = socialConflictAdapter(t).fieldStrategies?.items;
  assert.ok(strategy);
  const baseline: SocialFormValues["items"] = [
    { id: "base-private", kind: "website", href: "https://before.example" },
  ];
  const additions = strategy.resolve({
    baseline,
    current: [...baseline, { id: "server-private", kind: "linkedin", href: "https://server.example" }],
    local: [...baseline, { id: "local-private", kind: "github", href: "https://local.example" }],
    choices: {},
  });
  assert.equal(additions.status, "resolved");
  if (additions.status === "resolved") {
    assert.deepEqual(additions.value.map((item) => item.id), ["base-private", "server-private", "local-private"]);
  }

  const independent = strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, kind: "linkedin" }],
    local: [{ ...baseline[0]!, href: "https://after.example" }],
    choices: {},
  });
  assert.deepEqual(independent, {
    status: "resolved",
    value: [{ id: "base-private", kind: "linkedin", href: "https://after.example" }],
  });
});

void test("Social requires choices for the same property and deletion versus modification", () => {
  const adapter = socialConflictAdapter(t);
  const strategy = adapter.fieldStrategies?.items;
  assert.ok(strategy);
  const baseline: SocialFormValues["items"] = [{ id: "social-private", kind: "website", href: "https://before.example" }];
  const property = strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, href: "https://server.example" }],
    local: [{ ...baseline[0]!, href: "https://local.example" }],
    choices: {},
  });
  assert.deepEqual(property, {
    status: "incomplete",
    missingChoices: ["items:social-private:property:href"],
  });
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, href: "https://server.example" }],
    local: [{ ...baseline[0]!, href: "https://local.example" }],
    choices: { "items:social-private:property:href": "local" },
  }), {
    status: "resolved",
    value: [{ ...baseline[0]!, href: "https://local.example" }],
  });
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [],
    local: [{ ...baseline[0]!, href: "https://modified.example" }],
    choices: {},
  }), {
    status: "incomplete",
    missingChoices: ["items:social-private:presence"],
  });

  const presentation = strategy.present({
    baseline,
    current: [{ ...baseline[0]!, href: "https://server.example" }],
    local: [{ ...baseline[0]!, href: "https://local.example" }],
    choices: {},
  });
  assert.doesNotMatch(visiblePresentation(presentation), /social-private/);
});

void test("Social hides automatic additions while its complete plan keeps them", () => {
  const adapter = socialConflictAdapter(t);
  const baseline: SocialFormValues = {
    items: [{ id: "base", kind: "website", href: "https://base.example" }],
  };
  const current: SocialFormValues = {
    items: [
      { ...baseline.items[0]!, href: "https://saved.example" },
      { id: "saved-addition", kind: "linkedin", href: "https://saved-addition.example" },
    ],
  };
  const local: SocialFormValues = {
    items: [
      { ...baseline.items[0]!, href: "https://local.example" },
      { id: "local-addition", kind: "github", href: "https://local-addition.example" },
    ],
  };
  const completeGroups = adapter.fieldStrategies?.items?.present({
    baseline: baseline.items,
    current: current.items,
    local: local.items,
    choices: {},
  }) ?? [];
  const visibleGroups = toDecisionConflictGroups([{
    id: "social",
    items: completeGroups,
  }]);

  assert.ok(completeGroups.some((item) => item.resolutionMode === "automatic"));
  assert.deepEqual(visibleGroups[0]?.items.map((item) => item.id), [
    "items:base:property:href",
  ]);

  const plan = buildSettingsConflictMutationPlan({
    snapshot: { baseline, current, local, currentRevision: 45 },
    choices: { "items:base:property:href": "local" },
    fields: adapter,
  });
  assert.equal(plan.status, "mutation");
  if (plan.status === "mutation") {
    assert.deepEqual(plan.payload, {
      items: [
        { ...baseline.items[0]!, href: "https://local.example" },
        current.items[1],
        local.items[1],
      ],
    });
  }
});

void test("Social makes incompatible same-ID additions explicit and refuses duplicated IDs", () => {
  const strategy = socialConflictAdapter(t).fieldStrategies?.items;
  assert.ok(strategy);
  assert.deepEqual(strategy.resolve({
    baseline: [],
    current: [{ id: "shared-private", kind: "website", href: "https://saved.example" }],
    local: [{ id: "shared-private", kind: "website", href: "https://draft.example" }],
    choices: {},
  }), {
    status: "incomplete",
    missingChoices: ["items:shared-private:property:href"],
  });
  assert.deepEqual(strategy.resolve({
    baseline: [],
    current: [
      { id: "duplicate", kind: "website", href: "https://one.example" },
      { id: "duplicate", kind: "linkedin", href: "https://two.example" },
    ],
    local: [],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:manual:duplicate-id"] });
});

void test("Social adopts one-sided order and makes incompatible order an explicit choice", () => {
  const strategy = socialConflictAdapter(t).fieldStrategies?.items;
  assert.ok(strategy);
  const baseline: SocialFormValues["items"] = [
    { id: "a", kind: "website", href: "https://a.example" },
    { id: "b", kind: "linkedin", href: "https://b.example" },
    { id: "c", kind: "github", href: "https://c.example" },
  ];
  const compatible = strategy.resolve({ baseline, current: [baseline[1]!, baseline[0]!, baseline[2]!], local: baseline, choices: {} });
  assert.equal(compatible.status, "resolved");
  if (compatible.status === "resolved") assert.deepEqual(compatible.value.map((item) => item.id), ["b", "a", "c"]);
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [baseline[1]!, baseline[0]!, baseline[2]!],
    local: [baseline[0]!, baseline[2]!, baseline[1]!],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:manual:order-incompatible"] });
  const localOrder = strategy.resolve({
    baseline,
    current: [baseline[1]!, baseline[0]!, baseline[2]!],
    local: [baseline[0]!, baseline[2]!, baseline[1]!],
    choices: { "items:manual:order-incompatible": "local" },
  });
  assert.equal(localOrder.status, "resolved");
  if (localOrder.status === "resolved") {
    assert.deepEqual(localOrder.value.map((item) => item.id), ["a", "c", "b"]);
  }
});

void test("Social, Primary, and Legal incompatible orders expose short explicit sequences", () => {
  const assertOrderPresentation = (
    presentation: readonly ConflictPresentationItem[],
    expected: Readonly<{
      baseline: readonly string[];
      server: readonly string[];
      local: readonly string[];
    }>,
  ) => {
    assert.equal(presentation.length, 1);
    assert.deepEqual(presentation[0]?.orderComparison, expected);
    assert.equal(presentation[0]?.comparison, undefined);
    assert.deepEqual(presentation[0]?.options, {
      server: "studio.conflictResolution.actions.useServer",
      local: "studio.conflictResolution.actions.keepLocal",
    });
    assert.doesNotMatch(JSON.stringify(presentation[0]?.orderComparison), /position|·/iu);
  };

  const social = [
    { id: "a", kind: "website" as const, href: "https://a.example" },
    { id: "b", kind: "linkedin" as const, href: "https://b.example" },
    { id: "c", kind: "github" as const, href: "https://c.example" },
  ];
  assertOrderPresentation(
    socialConflictAdapter(t).fieldStrategies!.items!.present({
      baseline: social,
      current: [social[1]!, social[0]!, social[2]!],
      local: [social[0]!, social[2]!, social[1]!],
      choices: {},
    }),
    {
      baseline: [
        "studio.social.kind.website — https://a.example",
        "studio.social.kind.linkedin — https://b.example",
        "studio.social.kind.github — https://c.example",
      ],
      server: [
        "studio.social.kind.linkedin — https://b.example",
        "studio.social.kind.website — https://a.example",
        "studio.social.kind.github — https://c.example",
      ],
      local: [
        "studio.social.kind.website — https://a.example",
        "studio.social.kind.github — https://c.example",
        "studio.social.kind.linkedin — https://b.example",
      ],
    },
  );

  const child = (id: string, label: string) => ({ id, label, href: `/${id}`, newTab: false });
  const parent = (children: PrimaryMenuFormValues["items"][number]["children"]): PrimaryMenuFormValues["items"][number] => ({
    id: "parent",
    label: "Parent",
    href: "/parent",
    newTab: false,
    children,
  });
  const children = [child("a", "A"), child("b", "B"), child("c", "C")];
  assertOrderPresentation(
    primaryMenuConflictAdapter(t).fieldStrategies!.items!.present({
      baseline: [parent(children)],
      current: [parent([children[1]!, children[0]!, children[2]!])],
      local: [parent([children[0]!, children[2]!, children[1]!])],
      choices: {},
    }),
    {
      baseline: ["Parent", "A — Parent", "B — Parent", "C — Parent"],
      server: ["Parent", "B — Parent", "A — Parent", "C — Parent"],
      local: ["Parent", "A — Parent", "C — Parent", "B — Parent"],
    },
  );

  const legal = [child("a", "A"), child("b", "B"), child("c", "C")];
  assertOrderPresentation(
    legalMenuConflictAdapter(t).fieldStrategies!.items!.present({
      baseline: legal,
      current: [legal[1]!, legal[0]!, legal[2]!],
      local: [legal[0]!, legal[2]!, legal[1]!],
      choices: {},
    }),
    {
      baseline: ["A", "B", "C"],
      server: ["B", "A", "C"],
      local: ["A", "C", "B"],
    },
  );
});

void test("Primary menu combines parent and child additions and reconstructs the complete tree", () => {
  const strategy = primaryMenuConflictAdapter(t).fieldStrategies?.items;
  assert.ok(strategy);
  const parent = (id: string, label: string, children: PrimaryMenuFormValues["items"][number]["children"] = []): PrimaryMenuFormValues["items"][number] => ({ id, label, href: `/${id}`, newTab: false, children });
  const baseline: PrimaryMenuFormValues["items"] = [parent("p1", "Parent 1"), parent("p2", "Parent 2")];
  const result = strategy.resolve({
    baseline,
    current: [parent("p1", "Parent 1", [{ id: "server-child", label: "Server child", href: "/server", newTab: false }]), parent("p2", "Parent 2"), parent("server-parent", "Server parent")],
    local: [parent("p1", "Parent 1", [{ id: "local-child", label: "Local child", href: "/local", newTab: false }]), parent("p2", "Parent 2"), parent("local-parent", "Local parent")],
    choices: {},
  });
  assert.equal(result.status, "resolved");
  if (result.status === "resolved") {
    assert.deepEqual(result.value.map((item) => item.id), ["p1", "p2", "server-parent", "local-parent"]);
    assert.deepEqual(result.value[0]?.children?.map((item) => item.id), ["server-child", "local-child"]);
    assert.equal(new Set(result.value.flatMap((item) => [item.id, ...(item.children ?? []).map((child) => child.id)])).size, 6);
  }
});

void test("Primary menu merges independent fields and resolves parent moves by readable labels", () => {
  const adapter = primaryMenuConflictAdapter(t);
  const strategy = adapter.fieldStrategies?.items;
  assert.ok(strategy);
  const child = { id: "child-private", label: "Child", href: "/before", newTab: false };
  const baseline: PrimaryMenuFormValues["items"] = [
    { id: "parent-a", label: "Parent A", href: "/a", newTab: false, children: [child] },
    { id: "parent-b", label: "Parent B", href: "/b", newTab: false, children: [] },
    { id: "parent-c", label: "Parent C", href: "/c", newTab: false, children: [] },
  ];
  const server = structuredClone(baseline);
  server[0]!.children![0]!.label = "Server label";
  const local = structuredClone(baseline);
  local[0]!.children![0]!.href = "/local-href";
  const independent = strategy.resolve({ baseline, current: server, local, choices: {} });
  assert.equal(independent.status, "resolved");
  if (independent.status === "resolved") {
    assert.deepEqual(independent.value[0]?.children?.[0], { ...child, label: "Server label", href: "/local-href" });
  }

  const movedLocal = structuredClone(baseline);
  movedLocal[0]!.children = [];
  movedLocal[1]!.children = [child];
  const moved = strategy.resolve({ baseline, current: baseline, local: movedLocal, choices: {} });
  assert.equal(moved.status, "resolved");
  if (moved.status === "resolved") assert.equal(moved.value[1]?.children?.[0]?.id, "child-private");

  const movedServer = structuredClone(baseline);
  movedServer[0]!.children = [];
  movedServer[2]!.children = [child];
  const conflicting = strategy.resolve({ baseline, current: movedServer, local: movedLocal, choices: {} });
  assert.deepEqual(conflicting, {
    status: "incomplete",
    missingChoices: ["items:child-private:property:parentId"],
  });
  const presentation = strategy.present({ baseline, current: movedServer, local: movedLocal, choices: {} });
  const visible = visiblePresentation(presentation);
  assert.match(visible, /Parent A|Parent B|Parent C/);
  assert.doesNotMatch(visible, /parent-a|parent-b|parent-c|child-private/);
});

void test("Primary menu refuses same-property conflicts, deletion changes, and incompatible order", () => {
  const strategy = primaryMenuConflictAdapter(t).fieldStrategies?.items;
  assert.ok(strategy);
  const baseline: PrimaryMenuFormValues["items"] = [
    { id: "a", label: "A", href: "/a", newTab: false, children: [] },
    { id: "b", label: "B", href: "/b", newTab: false, children: [] },
    { id: "c", label: "C", href: "/c", newTab: false, children: [] },
  ];
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, label: "Server" }, baseline[1]!, baseline[2]!],
    local: [{ ...baseline[0]!, label: "Local" }, baseline[1]!, baseline[2]!],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:a:property:label"] });
  assert.deepEqual(strategy.resolve({
    baseline,
    current: baseline.slice(1),
    local: [{ ...baseline[0]!, href: "/changed" }, baseline[1]!, baseline[2]!],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:a:presence"] });
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [baseline[1]!, baseline[0]!, baseline[2]!],
    local: [baseline[0]!, baseline[2]!, baseline[1]!],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:manual:order-incompatible"] });
});

void test("Legal menu resolves additions and independent changes while preserving full payloads", () => {
  const adapter = legalMenuConflictAdapter(t);
  const strategy = adapter.fieldStrategies?.items;
  assert.ok(strategy);
  const baseline: LegalMenuFormValues["items"] = [{ id: "legal-private", label: "Legal", href: "/legal", newTab: false }];
  const result = strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, label: "Saved label" }, { id: "server-added", label: "Server", href: "/server", newTab: false }],
    local: [{ ...baseline[0]!, href: "/local", newTab: true }, { id: "local-added", label: "Local", href: "/local-added", newTab: false }],
    choices: {},
  });
  assert.equal(result.status, "resolved");
  if (result.status === "resolved") {
    assert.deepEqual(result.value, [
      { id: "legal-private", label: "Saved label", href: "/local", newTab: true },
      { id: "server-added", label: "Server", href: "/server", newTab: false },
      { id: "local-added", label: "Local", href: "/local-added", newTab: false },
    ]);
  }
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [{ ...baseline[0]!, href: "/saved" }],
    local: [{ ...baseline[0]!, href: "/draft" }],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:legal-private:property:href"] });

  const ordered: LegalMenuFormValues["items"] = [
    baseline[0]!,
    { id: "second", label: "Second", href: "/second", newTab: false },
  ];
  assert.deepEqual(strategy.resolve({
    baseline: ordered,
    current: [ordered[1]!, ordered[0]!],
    local: ordered,
    choices: {},
  }), { status: "resolved", value: [ordered[1]!, ordered[0]!] });
  assert.deepEqual(strategy.resolve({
    baseline,
    current: [],
    local: [{ ...baseline[0]!, label: "Modified" }],
    choices: {},
  }), { status: "incomplete", missingChoices: ["items:legal-private:presence"] });
});

void test("Settings mutation planning delegates items, emits one complete array, and keeps currentRevision", () => {
  const adapter = socialConflictAdapter(t);
  const baseline: SocialFormValues = { items: [{ id: "base", kind: "website", href: "https://base.example" }] };
  const current: SocialFormValues = { items: [...baseline.items, { id: "server", kind: "linkedin", href: "https://server.example" }] };
  const local: SocialFormValues = { items: [...baseline.items, { id: "local", kind: "github", href: "https://local.example" }] };
  const plan = buildSettingsConflictMutationPlan({
    snapshot: { baseline, current, local, currentRevision: 41 },
    choices: {},
    fields: adapter,
  });
  assert.equal(plan.status, "mutation");
  if (plan.status === "mutation") {
    assert.equal(plan.expectedRevision, 41);
    assert.deepEqual(plan.payload, { items: [
      baseline.items[0],
      current.items[1],
      local.items[1],
    ] });
  }
  const noChanges = buildSettingsConflictMutationPlan({
    snapshot: { baseline, current, local: current, currentRevision: 42 },
    choices: {},
    fields: adapter,
  });
  assert.equal(noChanges.status, "noChanges");
  const incomplete = buildSettingsConflictMutationPlan({
    snapshot: {
      baseline,
      current: { items: [{ ...baseline.items[0]!, href: "https://saved.example" }] },
      local: { items: [{ ...baseline.items[0]!, href: "https://draft.example" }] },
      currentRevision: 43,
    },
    choices: {},
    fields: adapter,
  });
  assert.equal(incomplete.status, "incomplete");

  const orderedBaseline: SocialFormValues = { items: [
    { id: "a", kind: "website", href: "https://a.example" },
    { id: "b", kind: "linkedin", href: "https://b.example" },
    { id: "c", kind: "github", href: "https://c.example" },
  ] };
  const manual = buildSettingsConflictMutationPlan({
    snapshot: {
      baseline: orderedBaseline,
      current: { items: [orderedBaseline.items[1]!, orderedBaseline.items[0]!, orderedBaseline.items[2]!] },
      local: { items: [orderedBaseline.items[0]!, orderedBaseline.items[2]!, orderedBaseline.items[1]!] },
      currentRevision: 44,
    },
    choices: {},
    fields: adapter,
  });
  assert.deepEqual(manual, {
    status: "incomplete",
    missingKeys: ["items:manual:order-incompatible"],
  });
  const selectedLocal = buildSettingsConflictMutationPlan({
    snapshot: {
      baseline: orderedBaseline,
      current: { items: [orderedBaseline.items[1]!, orderedBaseline.items[0]!, orderedBaseline.items[2]!] },
      local: { items: [orderedBaseline.items[0]!, orderedBaseline.items[2]!, orderedBaseline.items[1]!] },
      currentRevision: 44,
    },
    choices: { "items:manual:order-incompatible": "local" },
    fields: adapter,
  });
  assert.equal(selectedLocal.status, "mutation");
  const selectedServer = buildSettingsConflictMutationPlan({
    snapshot: {
      baseline: orderedBaseline,
      current: { items: [orderedBaseline.items[1]!, orderedBaseline.items[0]!, orderedBaseline.items[2]!] },
      local: { items: [orderedBaseline.items[0]!, orderedBaseline.items[2]!, orderedBaseline.items[1]!] },
      currentRevision: 44,
    },
    choices: { "items:manual:order-incompatible": "server" },
    fields: adapter,
  });
  assert.equal(selectedServer.status, "noChanges");
});
