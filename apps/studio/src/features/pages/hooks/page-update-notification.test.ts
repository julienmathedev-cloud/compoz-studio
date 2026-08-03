/**
 * @file apps/studio/src/features/pages/hooks/page-update-notification.test.ts
 * @layer studio/features/pages/hooks
 * @description Structural contracts for page metadata automatic-merge notifications.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./useUpdatePage.ts", import.meta.url), "utf8");

void test("only updated metadata with a revision jump is classified as automatic", () => {
  assert.match(source, /const metadataChanges = payload\.metadataChanges/u);
  assert.match(source, /response\.outcome === "updated" &&[\s\S]*metadataChanges !== undefined &&[\s\S]*isAutomaticRevisionMerge\([\s\S]*metadataChanges\.expectedMetaRevision,[\s\S]*response\.revisions\.metaRevision/u);
});

void test("the automatic metadata merge toast replaces updated and noChanges branches", () => {
  const automaticMergeBranch = source.indexOf("if (automaticMetadataMerge)");
  const noChangesBranch = source.indexOf('else if (response.outcome === "noChanges")');
  const updatedBranch = source.indexOf("notifyUpdated(", noChangesBranch);

  assert.ok(automaticMergeBranch >= 0);
  assert.ok(noChangesBranch > automaticMergeBranch);
  assert.ok(updatedBranch > noChangesBranch);
});
