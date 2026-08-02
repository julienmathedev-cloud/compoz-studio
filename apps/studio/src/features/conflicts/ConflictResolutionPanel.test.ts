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

void test("the shared panel alone owns two unselected radios and exactly two actions", () => {
  assert.equal(panelSource.match(/type="radio"/gu)?.length, 2);
  assert.equal(panelSource.match(/<Button\b/gu)?.length, 2);
  assert.match(panelSource, /checked=\{itemChoice === "server"\}/u);
  assert.match(panelSource, /checked=\{itemChoice === "local"\}/u);
  assert.match(panelSource, /disabled=\{!canApply\}/u);
  assert.match(panelSource, /onCancel/u);
  assert.match(panelSource, /onApply\(\{ \.\.\.decisionChoices \}\)/u);
  assert.match(panelSource, /toDecisionConflictGroups\(groups\)/u);
  assert.match(panelSource, /decisionGroups\.map/u);
  assert.doesNotMatch(panelSource, /\{groups\.map/u);
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
