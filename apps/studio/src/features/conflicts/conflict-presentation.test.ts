/**
 * @file apps/studio/src/features/conflicts/conflict-presentation.test.ts
 * @layer studio/features/conflicts
 * @description Regression tests for the pure shared OCC presentation model.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  canApplyConflictResolution,
  classifyConflictValue,
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  conflictPresentationStatusKey,
  hasCompleteConflictChoices,
  isDecisionItem,
  resolutionModeForStatus,
  toDecisionConflictChoices,
  toDecisionConflictGroups,
  toPlainTextRichText,
  type ConflictPresentationGroup,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  conflictItemDomIdentity,
  getFirstRequiredConflictChoiceId,
  executeConflictAction,
  scheduleConflictFocus,
  shouldRestoreConflictTrigger,
} from "@compoz/studio/features/conflicts/conflict-focus";

const decisionPresentation: readonly ConflictPresentationGroup[] = [
  {
    id: "mixed",
    label: "Mixed",
    items: [
      { id: "name", label: "Name", status: "conflict", resolutionMode: "choice" },
      { id: "server", label: "Server", status: "server-only", resolutionMode: "automatic" },
      { id: "local", label: "Local", status: "local-only", resolutionMode: "automatic" },
      { id: "same", label: "Same", status: "same-change", resolutionMode: "automatic" },
    ],
  },
  {
    id: "automatic-only",
    label: "Automatic only",
    items: [
      { id: "automatic", label: "Automatic", status: "local-only", resolutionMode: "automatic" },
    ],
  },
  {
    id: "second-decision",
    label: "Second decision",
    items: [
      { id: "slug", label: "Slug", status: "conflict", resolutionMode: "choice" },
    ],
  },
];

void test("projects only decision items and removes groups that become empty", () => {
  const groups = toDecisionConflictGroups(decisionPresentation);

  assert.deepEqual(groups.map((group) => [
    group.id,
    group.label,
    group.items.map((item) => item.id),
  ]), [
    ["mixed", "Mixed", ["name"]],
    ["second-decision", "Second decision", ["slug"]],
  ]);
  assert.equal(isDecisionItem(decisionPresentation[0]!.items[0]!), true);
  assert.equal(isDecisionItem(decisionPresentation[0]!.items[1]!), false);
  assert.equal(isDecisionItem({ id: "manual", label: "Manual", status: "conflict", resolutionMode: "manual" }), false);
});

void test("Apply validates and forwards only visible explicit decisions", () => {
  const groups = toDecisionConflictGroups(decisionPresentation);
  const oneDecision = toDecisionConflictGroups([decisionPresentation[0]!]);

  assert.equal(canApplyConflictResolution(oneDecision, false, { name: "local" }), true);
  assert.equal(canApplyConflictResolution(groups, false, { name: "server" }), false);
  assert.equal(canApplyConflictResolution(groups, false, {
    name: "server",
    slug: "local",
  }), true);
  assert.deepEqual(toDecisionConflictChoices(decisionPresentation, {
    name: "server",
    server: "local",
    local: "server",
    same: "local",
    automatic: "server",
    slug: "local",
  }), {
    name: "server",
    slug: "local",
  });
});

void test("focus skips hidden automatic items and targets the first unresolved decision", () => {
  const groups = toDecisionConflictGroups(decisionPresentation);

  assert.equal(getFirstRequiredConflictChoiceId(groups), "name");
  assert.equal(getFirstRequiredConflictChoiceId(groups, { name: "server" }), "slug");
  assert.equal(getFirstRequiredConflictChoiceId(groups, {
    name: "server",
    slug: "local",
  }), null);
});

void test("classifies every changed triple and excludes unchanged values", () => {
  assert.equal(classifyConflictValue("a", "a", "a"), null);
  assert.equal(classifyConflictValue("a", "b", "a"), "server-only");
  assert.equal(classifyConflictValue("a", "a", "b"), "local-only");
  assert.equal(classifyConflictValue("a", "b", "b"), "same-change");
  assert.equal(classifyConflictValue("a", "b", "c"), "conflict");
  assert.equal(classifyConflictValue(undefined, "", undefined), "server-only");
});

void test("requires a choice only for explicitly conflicting values", () => {
  const groups: readonly ConflictPresentationGroup[] = [{
    id: "metadata",
    items: [
      {
        id: "name",
        label: "Name",
        status: "same-change",
        resolutionMode: resolutionModeForStatus("same-change"),
        comparison: { baseline: { kind: "empty", text: "Empty" }, server: { kind: "text", text: "A" }, local: { kind: "text", text: "A" } },
      },
      {
        id: "slug",
        label: "Slug",
        status: "conflict",
        resolutionMode: resolutionModeForStatus("conflict"),
        comparison: { baseline: { kind: "text", text: "a" }, server: { kind: "text", text: "b" }, local: { kind: "text", text: "c" } },
      },
    ],
  }];

  assert.equal(hasCompleteConflictChoices(groups), false);
  assert.equal(canApplyConflictResolution(groups), false);
  const chosen: readonly ConflictPresentationGroup[] = groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.id === "slug" ? { ...item, choice: "local" as const } : item,
    ),
  }));
  assert.equal(hasCompleteConflictChoices(chosen), true);
  assert.equal(canApplyConflictResolution(chosen), true);
  assert.equal(canApplyConflictResolution(chosen, true), false);
  assert.equal(canApplyConflictResolution([{ id: "empty", items: [] }]), true);
  assert.equal(canApplyConflictResolution([{ id: "several", items: [
    { ...chosen[0]!.items[1]!, id: "chosen", choice: "server" },
    { ...groups[0]!.items[1]!, id: "missing" },
  ] }]), false);
  assert.equal(canApplyConflictResolution([{ id: "manual", items: [{ id: "item", label: "Item", status: "conflict", resolutionMode: "manual" }] }]), false);
  assert.equal(canApplyConflictResolution([{ id: "automatic", items: [{ id: "item", label: "Item", status: "server-only", resolutionMode: "automatic" }] }]), true);
});

void test("validates the panel-owned server, local, partial, mixed, and automatic choices", () => {
  const one: readonly ConflictPresentationGroup[] = [{
    id: "one",
    items: [{ id: "title", label: "Title", status: "conflict", resolutionMode: "choice" }],
  }];
  assert.equal(canApplyConflictResolution(one, false, {}), false);
  assert.equal(canApplyConflictResolution(one, false, { title: "server" }), true);
  assert.equal(canApplyConflictResolution(one, false, { title: "local" }), true);

  const several: readonly ConflictPresentationGroup[] = [{
    id: "several",
    items: [
      ...one[0]!.items,
      { id: "slug", label: "Slug", status: "conflict", resolutionMode: "choice" },
      { id: "automatic", label: "Automatic", status: "local-only", resolutionMode: "automatic" },
    ],
  }];
  assert.equal(canApplyConflictResolution(several, false, { title: "server" }), false);
  assert.equal(canApplyConflictResolution(several, false, { title: "server", slug: "local" }), true);
  assert.equal(canApplyConflictResolution(several, true, { title: "server", slug: "local" }), false);
});

void test("formats rich text into safe readable text", () => {
  assert.equal(
    toPlainTextRichText("<p>Hello &amp; <strong>world</strong></p><p>Next</p>", "Empty"),
    "Hello & world\nNext",
  );
  assert.equal(toPlainTextRichText("<p> </p>", "Empty"), "Empty");
  assert.equal(toPlainTextRichText("&#x41; &#65;", "Empty"), "A A");
  assert.equal(toPlainTextRichText("&#x110000; &#55296; &#oops;", "Empty"), "� � &#oops;");
  assert.equal(toPlainTextRichText("Text <strong", "Empty"), "Text <strong");
});

void test("chooses the next unresolved choice and preserves a valid trigger only", () => {
  const groups: readonly ConflictPresentationGroup[] = [{
    id: "group",
    items: [
      { id: "done", label: "Done", status: "conflict", resolutionMode: "choice", choice: "server", comparison: { baseline: { kind: "text", text: "a" }, server: { kind: "text", text: "b" }, local: { kind: "text", text: "c" } } },
      { id: "next", label: "Next", status: "conflict", resolutionMode: "choice", comparison: { baseline: { kind: "text", text: "a" }, server: { kind: "text", text: "b" }, local: { kind: "text", text: "c" } } },
    ],
  }];
  assert.equal(getFirstRequiredConflictChoiceId(groups), "next");
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true }), true);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: false }), false);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true, disabled: true }), false);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true, ariaDisabled: "true" }), false);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true, hidden: true }), false);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true, hasFocusMethod: false }), false);
  assert.equal(shouldRestoreConflictTrigger({ isConnected: true, didNavigate: true }), false);
});

void test("isolates radio names and DOM ids by conflict identity", () => {
  const primary = conflictItemDomIdentity("primary-menu-12", "items");
  const legal = conflictItemDomIdentity("legal-menu-7", "items");
  const repeated = conflictItemDomIdentity("primary-menu-12", "items");

  assert.deepEqual(primary, repeated);
  assert.notEqual(primary.radioName, legal.radioName);
  assert.notEqual(primary.statusId, legal.statusId);
  assert.notEqual(primary.firstChoiceToken, legal.firstChoiceToken);
});

void test("rechecks focusability in the deferred task after React can re-enable the form", () => {
  const scheduled: Array<() => void> = [];
  const focused: string[] = [];
  const target = {
    isConnected: true,
    disabled: true,
    ariaDisabled: null,
    hidden: false,
    hasFocusMethod: true,
    focus: () => focused.push("focused"),
  };
  scheduleConflictFocus({
    getTarget: () => target,
    schedule: (task) => scheduled.push(task),
  });
  assert.deepEqual(focused, []);
  target.disabled = false;
  scheduled.shift()?.();
  assert.deepEqual(focused, ["focused"]);
});

void test("deferred focus ignores targets that remain disabled, disconnect, or become aria-disabled", () => {
  const cases = [
    { isConnected: true, disabled: true, ariaDisabled: null },
    { isConnected: false, disabled: false, ariaDisabled: null },
    { isConnected: true, disabled: false, ariaDisabled: "true" },
  ];
  for (const state of cases) {
    const scheduled: Array<() => void> = [];
    let focused = false;
    scheduleConflictFocus({
      getTarget: () => ({
        ...state,
        hidden: false,
        hasFocusMethod: true,
        focus: () => { focused = true; },
      }),
      schedule: (task) => scheduled.push(task),
    });
    scheduled.shift()?.();
    assert.equal(focused, false);
  }
});

void test("focus success is gated by an explicit action result", async () => {
  const unexpected: unknown[] = [];
  assert.deepEqual(await executeConflictAction(() => CONFLICT_ACTION_SUCCESS, unexpected.push.bind(unexpected)), CONFLICT_ACTION_SUCCESS);
  assert.deepEqual(await executeConflictAction(async () => CONFLICT_ACTION_SUCCESS, unexpected.push.bind(unexpected)), CONFLICT_ACTION_SUCCESS);
  assert.deepEqual(await executeConflictAction(async () => CONFLICT_ACTION_ERROR, unexpected.push.bind(unexpected)), CONFLICT_ACTION_ERROR);
  assert.deepEqual(await executeConflictAction(async () => { throw new Error("failure"); }, unexpected.push.bind(unexpected)), CONFLICT_ACTION_ERROR);
  assert.equal(unexpected.length, 1);
});

void test("allows a new explicit action attempt after an error result", async () => {
  let attempts = 0;
  const action = async () => {
    attempts += 1;
    return attempts === 1 ? CONFLICT_ACTION_ERROR : CONFLICT_ACTION_SUCCESS;
  };
  assert.equal((await executeConflictAction(action, () => void 0)).status, "error");
  assert.equal((await executeConflictAction(action, () => void 0)).status, "success");
  assert.equal(attempts, 2);
});

void test("maps automatic, choice, and manual items to an accessible status message key", () => {
  assert.equal(conflictPresentationStatusKey({ status: "server-only", resolutionMode: "automatic" }), "serverOnly");
  assert.equal(conflictPresentationStatusKey({ status: "local-only", resolutionMode: "automatic" }), "localOnly");
  assert.equal(conflictPresentationStatusKey({ status: "same-change", resolutionMode: "automatic" }), "sameChange");
  assert.equal(conflictPresentationStatusKey({ status: "conflict", resolutionMode: "choice" }), "conflict");
  assert.equal(conflictPresentationStatusKey({ status: "conflict", resolutionMode: "manual" }), "manual");
});
