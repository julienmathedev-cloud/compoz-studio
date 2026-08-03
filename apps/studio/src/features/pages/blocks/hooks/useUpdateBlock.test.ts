/**
 * @file apps/studio/src/features/pages/blocks/hooks/useUpdateBlock.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Structural notification contracts for OCC block updates.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./useUpdateBlock.ts", import.meta.url),
  "utf8",
);

void test("the OCC payload is built once and carries its changed fields to success", () => {
  assert.equal(
    source.match(/toUpdateSectionBlockIntentDTOFromFormValues\(/gu)?.length,
    1,
  );
  assert.match(source, /const fields = Object\.keys\(payload\.changes\)/u);
  assert.match(source, /return \{[\s\S]*response,[\s\S]*fields,[\s\S]*expectedBlocksRevision: payload\.expectedBlocksRevision/u);
  assert.match(source, /onSuccess: async \(\{ response, fields, expectedBlocksRevision \}\)/u);
});

void test("normal updates describe non-empty fields while automatic merges replace that toast", () => {
  const automaticMergeBranch = source.indexOf("if (automaticMerge)");
  const updatedBranch = source.indexOf("else if (fields.length > 0)");

  assert.ok(automaticMergeBranch >= 0);
  assert.ok(updatedBranch > automaticMergeBranch);
  assert.match(source, /response\.outcome === "updated" &&[\s\S]*isAutomaticRevisionMerge\([\s\S]*expectedBlocksRevision,[\s\S]*response\.blocksRevision/u);
  assert.match(source, /fields: fields\.join\(", "\)/u);
  assert.doesNotMatch(source, /notifications\.updated\.description", \{ fields: "" \}/u);
});

void test("the public update contract still resolves to the server response", () => {
  assert.match(source, /Promise<UpdateSectionBlockResponse>/u);
  assert.match(source, /await mutation\.mutateAsync\(args\)[\s\S]*\)\.response/u);
  assert.match(source, /onSuccess\?\.\(response\)/u);
});
