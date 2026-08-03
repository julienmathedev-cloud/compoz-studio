/**
 * @file apps/studio/src/features/pages/components/organisms/PageForm.parent-selection.test.ts
 * @layer studio/features/pages/components/organisms
 * @description Guards the parent-selection lock for pages that already have children.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageFormSource = readFileSync(
  new URL("./PageForm.tsx", import.meta.url),
  "utf8",
);

void test("PageForm disables its single parent selector when requested", () => {
  assert.match(pageFormSource, /parentSelectionDisabled\?: boolean/u);
  assert.match(pageFormSource, /parentSelectionDisabled = false,/u);
  assert.match(
    pageFormSource,
    /disabled=\{isBusy \|\| parentSelectionDisabled\}/u,
  );
  assert.match(
    pageFormSource,
    /parentSelectionDisabled\s*\?\s*t\("studio\.pageForm\.parent\.helpHasChildren"\)\s*:\s*t\("studio\.pageForm\.parent\.help"\)/u,
  );

  const parentIdControllers =
    pageFormSource.match(/<Controller\s+name="parentId"/gu) ?? [];
  assert.equal(parentIdControllers.length, 1);
});

void test("PageEditSection locks parent selection only for edited pages with children", () => {
  const source = readFileSync(
    new URL("../../sections/PageEditSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /if \(mode !== "edit" \|\| !editId \|\| !index\) return false;/u,
  );
  assert.match(source, /pageItem\.parentId === editId/u);
  assert.match(source, /parentSelectionDisabled=\{parentSelectionDisabled\}/u);
  assert.match(source, /parentOptions=\{parentOptions\}/u);
});

void test("PageBlocksListSection reuses its canonical children list for the lock", () => {
  const source = readFileSync(
    new URL("../../sections/PageBlocksListSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /const children = useMemo\(\(\) => \{\s*const pages = siteIndex\?\.pages \?\? \[\];\s*return pages\.filter\(\(pageItem\) => pageItem\.parentId === pageId\);/u,
  );
  assert.match(source, /parentSelectionDisabled=\{children\.length > 0\}/u);
  assert.match(source, /parentOptions=\{parentOptions\}/u);
});
