/**
 * @file apps/studio/src/features/conflicts/controlled-conflict-resolution.test.ts
 * @layer studio/features/conflicts
 * @description Tests the shared simple/composite OCC interaction policy.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildControlledConflictResolutionPolicy,
  isControlledConflictActionDisabled,
} from "@compoz/studio/features/conflicts/controlled-conflict-resolution";
import { CONFLICT_ACTION_SUCCESS } from "@compoz/studio/features/conflicts/conflict-presentation";
import type { ConflictPresentationGroup } from "@compoz/studio/features/conflicts/conflict-presentation";
import { toPageMetadataConflictPanelController } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-panel-controller";
import { createPageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type { PageMetadataConflictController } from "@compoz/studio/features/pages/conflicts/usePageMetadataConflictController";
import { toSettingsConflictPanelController } from "@compoz/studio/features/settings/conflicts/settings-conflict-panel-controller";
import type { SettingsConflictController } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const action = async () => CONFLICT_ACTION_SUCCESS;
const conflict = (id: string, choice?: "server" | "local") => ({
  id,
  label: id,
  status: "conflict" as const,
  resolutionMode: "choice" as const,
  choice,
});

function policy(groups: readonly ConflictPresentationGroup[], overrides: Readonly<Record<string, unknown>> = {}) {
  return buildControlledConflictResolutionPolicy({
    groups,
    canResolve: true,
    canUseLocalDirectlyInSimple: true,
    canKeepAllLocalInComposite: true,
    keepLocalEquivalentToApply: true,
    adoptCurrent: action,
    keepLocal: action,
    apply: action,
    retryFreshRead: action,
    ...overrides,
  });
}

void test("uses direct actions and hides radios for one isolated equivalent conflict", () => {
  const result = policy([{ id: "group", items: [conflict("name")] }]);

  assert.equal(result.mode, "simple");
  assert.deepEqual(result.actionIds, ["abandon", "adopt-current", "keep-all-local"]);
  assert.equal(result.groups[0]?.items[0]?.resolutionMode, "automatic");
});

void test("keeps radios and Apply for several conflicts", () => {
  const result = policy([{ id: "group", items: [conflict("name"), conflict("slug")] }]);

  assert.equal(result.mode, "composite");
  assert.deepEqual(result.actionIds, ["abandon", "adopt-current", "keep-all-local", "apply"]);
  assert.equal(result.groups[0]?.items[0]?.resolutionMode, "choice");
  assert.equal(result.groups[0]?.items[1]?.resolutionMode, "choice");
});

for (const item of [
  { id: "server", label: "server", status: "server-only" as const, resolutionMode: "automatic" as const },
  { id: "local", label: "local", status: "local-only" as const, resolutionMode: "automatic" as const },
  { id: "same", label: "same", status: "same-change" as const, resolutionMode: "automatic" as const },
  { id: "list", label: "list", status: "conflict" as const, resolutionMode: "manual" as const },
]) {
  void test(`keeps composite mode when ${item.id} also needs merging`, () => {
    const result = policy([{ id: "group", items: [conflict("name"), item] }]);
    assert.equal(result.mode, "composite");
  });
}

void test("requires both global operations and semantic local equivalence for simple mode", () => {
  const groups = [{ id: "group", items: [conflict("name")] }];

  assert.equal(policy(groups, { adoptCurrent: undefined }).mode, "composite");
  assert.equal(policy(groups, { canUseLocalDirectlyInSimple: false }).mode, "composite");
  assert.equal(policy(groups, { keepLocal: undefined }).mode, "composite");
  assert.equal(policy(groups, { keepLocalEquivalentToApply: false }).mode, "composite");
});

void test("disables Apply until choices are complete and disables every action while pending", () => {
  assert.equal(isControlledConflictActionDisabled({ pending: false, canApply: false }, "apply"), true);
  assert.equal(isControlledConflictActionDisabled({ pending: false, canApply: true }, "apply"), false);
  for (const actionId of ["abandon", "adopt-current", "keep-all-local", "apply", "retry-fresh-read"] as const) {
    assert.equal(isControlledConflictActionDisabled({ pending: true, canApply: true }, actionId), true);
  }
});

function settingsController(
  groups: readonly ConflictPresentationGroup[],
  canKeepLocal: boolean,
): SettingsConflictController {
  return {
    conflictId: "settings",
    groups,
    pending: false,
    canResolve: true,
    canApply: true,
    canKeepLocal,
    choose: () => undefined,
    abandon: () => CONFLICT_ACTION_SUCCESS,
    adoptCurrent: action,
    keepLocal: action,
    apply: action,
    retryFreshRead: action,
  };
}

void test("Settings simple exposes direct local without radios or Apply", () => {
  const groups = [{ id: "settings", items: [conflict("name")] }];
  const result = buildControlledConflictResolutionPolicy(
    toSettingsConflictPanelController(settingsController(groups, false)),
  );

  assert.equal(result.mode, "simple");
  assert.equal(result.groups[0]?.items[0]?.resolutionMode, "automatic");
  assert.deepEqual(result.actionIds, ["abandon", "adopt-current", "keep-all-local"]);
});

void test("Settings scalar composite omits keep-all-local when its business capability is false", () => {
  const groups = [{ id: "settings", items: [conflict("name"), conflict("slug")] }];
  const result = buildControlledConflictResolutionPolicy(
    toSettingsConflictPanelController(settingsController(groups, false)),
  );

  assert.equal(result.mode, "composite");
  assert.deepEqual(result.actionIds, ["abandon", "adopt-current", "apply"]);
});

void test("Settings manual composite exposes keep-all-local only when supported", () => {
  const groups = [{
    id: "settings",
    items: [
      conflict("name"),
      { id: "list", label: "list", status: "conflict" as const, resolutionMode: "manual" as const },
    ],
  }];
  const result = buildControlledConflictResolutionPolicy(
    toSettingsConflictPanelController(settingsController(groups, true)),
  );

  assert.equal(result.mode, "composite");
  assert.deepEqual(result.actionIds, ["abandon", "adopt-current", "keep-all-local", "apply"]);
});

void test("Metadata simple and composite use the same shared policy wrapper", () => {
  const baseline: PageFormValues = {
    name: "Initial",
    slug: "initial",
    seoTitle: null,
    seoDescription: null,
    parentId: null,
    sitemap: null,
    paginationEnabled: false,
  };
  const state = createPageMetadataConflictState({
    expectedMetaRevision: 1,
    currentMetaRevision: 2,
    conflicts: [{ field: "name", baseline: "Initial", local: "Local", current: "Remote" }],
    current: {
      page: {
        id: "page",
        parentId: null,
        slug: "initial",
        name: "Remote",
        seoTitle: null,
        seoDescription: null,
        blocks: [],
        sitemap: null,
        paginationEnabled: false,
        meta: { createdAt: "2026-01-01", updatedAt: "2026-01-02" },
      },
      revisions: { metaRevision: 2, blocksRevision: 1 },
    },
  }, baseline, { ...baseline, name: "Local" });
  const controller: PageMetadataConflictController = {
    state,
    conflictId: "metadata",
    pending: false,
    canApply: true,
    choices: {},
    choose: () => undefined,
    abandon: () => CONFLICT_ACTION_SUCCESS,
    adoptCurrent: action,
    keepLocal: action,
    apply: action,
  };
  const simpleGroups = [{ id: "metadata", items: [conflict("name")] }];
  const compositeGroups = [{ id: "metadata", items: [conflict("name"), conflict("slug")] }];

  const simple = buildControlledConflictResolutionPolicy(
    toPageMetadataConflictPanelController(controller, simpleGroups),
  );
  const composite = buildControlledConflictResolutionPolicy(
    toPageMetadataConflictPanelController(controller, compositeGroups),
  );

  assert.equal(simple.mode, "simple");
  assert.equal(composite.mode, "composite");
  assert.deepEqual(composite.actionIds, ["abandon", "adopt-current", "keep-all-local", "apply"]);
});

void test("uses only recovery operations supplied by the controller", () => {
  const result = policy([], { canResolve: false });
  assert.deepEqual(result.actionIds, ["abandon", "retry-fresh-read"]);
});

void test("the shared wrapper alone promotes the last simple local action", () => {
  const source = readFileSync(
    new URL("./ControlledConflictResolutionPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /policy\.mode === "simple"\s*\? actionLabels\.keepLocalSimple/u);
  assert.match(
    source,
    /policy\.mode === "simple"\s*\? "default" as const\s*: "outline" as const/u,
  );
});
