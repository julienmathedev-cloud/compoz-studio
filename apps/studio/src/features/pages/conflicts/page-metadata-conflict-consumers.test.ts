/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-consumers.test.ts
 * @layer studio/features/pages/conflicts
 * @description Guards the single metadata-only persistence path used by both PageForm consumers.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const section of ["PageEditSection.tsx", "PageBlocksListSection.tsx"]) {
  void test(`${section} delegates metadata success to the shared metadata-only path`, () => {
    const source = readFileSync(
      new URL(`../sections/${section}`, import.meta.url),
      "utf8",
    );

    assert.match(source, /usePageMetadataConflictPersistence/u);
    assert.match(source, /resolveMetadataConflict/u);
    assert.match(source, /onMetadataConflictCommit=\{metadataConflictPersistence\.commit\}/u);
    assert.match(source, /onMetadataConflictMutate=\{metadataConflictPersistence\.mutate\}/u);
    assert.match(source, /onResolved: handleMetadataResolved/u);
    assert.doesNotMatch(source, /onMetadataConflictChoice/u);
  });
}

void test("PageEditSection owns only its conditional presentation cleanup", () => {
  const source = readFileSync(
    new URL("../sections/PageEditSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /applyPageEditMetadataResolutionPresentationCleanup/u);
  assert.match(source, /closeEditor: onCancelEdit/u);
  assert.match(source, /remountForm: \(\) => setFormKey/u);
});

void test("PageBlocksListSection owns only its conditional presentation cleanup", () => {
  const source = readFileSync(
    new URL("../sections/PageBlocksListSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /applyPageBlocksMetadataResolutionPresentationCleanup/u);
  assert.match(source, /remountForm: \(\) => setPageFormKey/u);
  assert.doesNotMatch(source, /closeEditor:/u);
});

void test("abandon closes only the OCC panel and never enters terminal cleanup", () => {
  const source = readFileSync(
    new URL("./usePageMetadataConflictController.ts", import.meta.url),
    "utf8",
  );
  const abandonStart = source.lastIndexOf("abandon: () => {");
  const abandonEnd = source.indexOf("apply,", abandonStart);
  const abandonBranch = source.slice(abandonStart, abandonEnd);

  assert.ok(abandonStart > 0);
  assert.ok(abandonEnd > abandonStart);
  assert.match(abandonBranch, /input\.onAbandon\(\)/u);
  assert.doesNotMatch(abandonBranch, /input\.onCommit/u);
});

void test("adoptCurrent emits terminal presentation without entering the mutation path", () => {
  const source = readFileSync(
    new URL("./usePageMetadataConflictController.ts", import.meta.url),
    "utf8",
  );
  const adoptStart = source.indexOf("const adoptCurrent =");
  const adoptEnd = source.indexOf("const apply =", adoptStart);
  const adoptBranch = source.slice(adoptStart, adoptEnd);

  assert.ok(adoptStart > 0);
  assert.ok(adoptEnd > adoptStart);
  assert.match(adoptBranch, /input\.commitValues\(values\)/u);
  assert.match(adoptBranch, /input\.onCommit\(\{/u);
  assert.match(adoptBranch, /source: "adopt-current"/u);
  assert.doesNotMatch(adoptBranch, /input\.onMutate/u);
});

void test("PageForm renders one metadata panel before its fields card", () => {
  const source = readFileSync(
    new URL("../components/organisms/PageForm.tsx", import.meta.url),
    "utf8",
  );
  const panelMatches = source.match(/<PageMetadataConflictPanel/gu) ?? [];
  const panelIndex = source.indexOf("<PageMetadataConflictPanel");
  const cardIndex = source.indexOf('<Card variant="panel" visualMode="studio">');

  assert.equal(panelMatches.length, 1);
  assert.ok(panelIndex > 0);
  assert.ok(cardIndex > panelIndex);
});
