/**
 * @file apps/studio/src/features/conflicts/ConflictResolutionPanel.test.ts
 * @layer studio/features/conflicts
 * @description Structural contract tests for the single interactive OCC panel.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const panelUrl = new URL("./ConflictResolutionPanel.tsx", import.meta.url);
const panelSource = readFileSync(panelUrl, "utf8");

void test("the shared panel owns granular, direct, and close-only actions", () => {
  assert.equal(panelSource.match(/type="radio"/gu)?.length, 2);
  assert.equal(panelSource.match(/<Button\b/gu)?.length, 3);
  assert.match(panelSource, /checked=\{itemChoice === "server"\}/u);
  assert.match(panelSource, /checked=\{itemChoice === "local"\}/u);
  assert.match(panelSource, /disabled=\{!canApply\}/u);
  assert.match(panelSource, /onCancel/u);
  assert.match(panelSource, /action\.onApply\(\{ \.\.\.decisionChoices \}\)/u);
  assert.match(panelSource, /action\.kind === "direct"/u);
  assert.match(panelSource, /runAction\(action\.onAction/u);
  assert.match(panelSource, /action\.kind === "choices" && hasGranularChoices/u);
  assert.match(panelSource, /toDecisionConflictGroups\(groups\)/u);
  assert.match(panelSource, /presentationGroups\.map/u);
  assert.match(panelSource, /toManualConflictGroups\(groups\)/u);
});

void test("mobile order keys remain unique when two visible labels are identical", () => {
  const repeatedLabels = ["Same name", "Same name"];
  assert.deepEqual(
    repeatedLabels.map((value, index) => `${index}-${value}`),
    ["0-Same name", "1-Same name"],
  );
  assert.match(panelSource, /order\.map\(\(value, index\)/u);
  assert.match(panelSource, /key=\{`\$\{index\}-\$\{value\}`\}/u);
});

void test("lists and order comparisons use semantic responsive markup", () => {
  assert.match(panelSource, /<CardContent className="mt-2 space-y-4">/u);
  assert.doesNotMatch(panelSource, /items\.join\(" · "\)/u);
  assert.match(panelSource, /<ul className="list-disc/u);
  assert.match(panelSource, /<ol className="list-decimal/u);
  assert.match(panelSource, /md:hidden/u);
  assert.match(panelSource, /<table/u);
  assert.match(panelSource, /<caption className="sr-only"/u);
  assert.match(panelSource, /scope="col"/u);
  assert.match(panelSource, /scope="row"/u);
  assert.match(panelSource, /\?\? "—"/u);
});

void test("pending and conflict replacement are locked and reset only in the shared panel", () => {
  assert.match(panelSource, /actionPendingRef\.current/u);
  assert.match(panelSource, /if \(pending \|\| actionPendingRef\.current\) return/u);
  assert.match(panelSource, /previousConflictKeyRef\.current !== conflictKey/u);
  assert.match(panelSource, /selection\.conflictKey === conflictKey \? selection\.choices : \{\}/u);
  assert.match(panelSource, /getFirstRequiredConflictChoiceId\([\s\S]*decisionGroups,[\s\S]*decisionChoices/u);
  assert.match(panelSource, /disabled=\{pending\}/u);
});

void test("Settings, Metadata, and both block adapters import the same panel", () => {
  for (const relative of [
    "../settings/conflicts/SettingsConflictPanel.tsx",
    "../pages/components/molecules/PageMetadataConflictPanel.tsx",
    "../pages/blocks/conflicts/BlockListConflictPanel.tsx",
    "../pages/blocks/conflicts/BlockUpdateConflictPanel.tsx",
  ]) {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    assert.match(source, /features\/conflicts\/ConflictResolutionPanel/u);
    assert.doesNotMatch(source, /type="radio"|<Button\b/u);
  }
});

void test("block adapters replace granular Apply with the direct reload action when required", () => {
  for (const relative of [
    "../pages/blocks/conflicts/BlockListConflictPanel.tsx",
    "../pages/blocks/conflicts/BlockUpdateConflictPanel.tsx",
  ]) {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    assert.match(source, /scenario\.actionMode === "reload"/u);
    assert.match(source, /kind: "direct"/u);
    assert.match(source, /choices\.reloadSavedVersion/u);
    assert.match(source, /action=\{action\}/u);
  }

  const listSource = readFileSync(
    new URL("../pages/blocks/conflicts/BlockListConflictPanel.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(listSource, /operation: details\.operation/u);
});

void test("no second interactive conflict component remains", () => {
  const featuresUrl = new URL("../", import.meta.url);
  const componentFiles = readdirSync(featuresUrl, {
    recursive: true,
    encoding: "utf8",
  }).filter((file) => file.endsWith(".tsx"));
  const radioOwners = componentFiles.filter((file) =>
    readFileSync(new URL(file, featuresUrl), "utf8").includes('type="radio"'),
  );
  assert.deepEqual(radioOwners, ["conflicts/ConflictResolutionPanel.tsx"]);
  assert.equal(
    existsSync(new URL("./ControlledConflictResolutionPanel.tsx", import.meta.url)),
    false,
  );
});
