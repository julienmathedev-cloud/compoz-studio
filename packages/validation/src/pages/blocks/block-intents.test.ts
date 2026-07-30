/**
 * @file packages/validation/src/pages/blocks/block-intents.test.ts
 * @layer validation/pages/blocks
 * @description Boundary tests for the four strict Page block OCC intents.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  CreateSectionBlockIntentSchema,
  DeleteBlockIntentSchema,
  ReorderBlocksIntentSchema,
  UpdateSectionBlockIntentSchema,
} from "@compoz/validation/pages/blocks/block-intents";

const BLOCK = {
  id: "block-a",
  type: "section" as const,
  name: "Block",
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [],
};

void test("all block mutations require a non-negative expectedBlocksRevision", () => {
  const payloads = [
    [
      CreateSectionBlockIntentSchema,
      {
        baselineOrder: [],
        baselineLcpPriorityBlockId: null,
        placement: { kind: "end" },
        containerMode: "contained",
        cssClassName: "",
        lcpPriority: false,
        rows: [],
      },
    ],
    [
      UpdateSectionBlockIntentSchema,
      { baselineLcpPriorityBlockId: null, changes: {} },
    ],
    [DeleteBlockIntentSchema, { baselineBlock: BLOCK }],
    [
      ReorderBlocksIntentSchema,
      { baselineOrder: ["a"], localOrder: ["a"] },
    ],
  ] as const;

  for (const [schema, payload] of payloads) {
    assert.equal(schema.safeParse(payload).success, false);
    assert.equal(
      schema.safeParse({ ...payload, expectedBlocksRevision: 0 }).success,
      true,
    );
  }
});

void test("create uses relative placement and rejects insertAt", () => {
  const base = {
    expectedBlocksRevision: 2,
    baselineOrder: ["a"],
    baselineLcpPriorityBlockId: null,
    containerMode: "contained",
    cssClassName: "",
    lcpPriority: false,
    rows: [],
  };
  for (const placement of [
    { kind: "start" },
    { kind: "end" },
    { kind: "before", blockId: "a" },
    { kind: "after", blockId: "a" },
  ]) {
    assert.equal(
      CreateSectionBlockIntentSchema.safeParse({ ...base, placement }).success,
      true,
    );
  }
  assert.equal(
    CreateSectionBlockIntentSchema.safeParse({
      ...base,
      placement: { kind: "end" },
      insertAt: 1,
    }).success,
    false,
  );
});

void test("update route body contains changes but never blockId", () => {
  const payload = {
    expectedBlocksRevision: 3,
    baselineLcpPriorityBlockId: "a",
    changes: {
      name: { baseline: "Before", local: "After" },
      rows: { baseline: [], local: [] },
    },
  };
  assert.equal(UpdateSectionBlockIntentSchema.safeParse(payload).success, true);
  assert.equal(
    UpdateSectionBlockIntentSchema.safeParse({
      ...payload,
      blockId: "body-id",
    }).success,
    false,
  );
});

void test("update validates baselines without transforming persisted values", () => {
  const baselineRows = [{
    id: " row ",
    columnsCount: 1 as const,
    reverseOn: { mobile: false, tablet: false, desktop: false },
    columns: [{
      id: " column ",
      cells: [{
        id: "rich",
        kind: "richText" as const,
        content: "  <p>persisted</p>\n",
        reveal: false,
      }],
    }],
  }];
  const parsed = UpdateSectionBlockIntentSchema.parse({
    expectedBlocksRevision: 3,
    baselineLcpPriorityBlockId: null,
    changes: {
      name: { baseline: " Persisted ", local: " Local " },
      cssClassName: {
        baseline: " persisted-class ",
        local: " local-class ",
      },
      rows: { baseline: baselineRows, local: baselineRows },
    },
  });

  assert.equal(parsed.changes.name?.baseline, " Persisted ");
  assert.equal(parsed.changes.name?.local, "Local");
  assert.equal(
    parsed.changes.cssClassName?.baseline,
    " persisted-class ",
  );
  assert.equal(parsed.changes.cssClassName?.local, "local-class");
  assert.strictEqual(parsed.changes.rows?.baseline, baselineRows);
  assert.equal(parsed.changes.rows?.baseline[0]?.id, " row ");
  assert.equal(parsed.changes.rows?.local[0]?.id, "row");
  const richText = parsed.changes.rows?.baseline[0]?.columns[0]?.cells[0];
  assert.equal(
    richText?.kind === "richText" ? richText.content : null,
    "  <p>persisted</p>\n",
  );
});

void test("delete validates and preserves the exact persisted block snapshot", () => {
  const persistedBlock = {
    ...BLOCK,
    name: " Persisted ",
    cssClassName: " persisted-class ",
  };
  const parsed = DeleteBlockIntentSchema.parse({
    expectedBlocksRevision: 4,
    baselineBlock: persistedBlock,
  });

  assert.strictEqual(parsed.baselineBlock, persistedBlock);
  assert.equal(parsed.baselineBlock.name, " Persisted ");
  assert.equal(parsed.baselineBlock.cssClassName, " persisted-class ");
});

void test("reorder rejects duplicate, empty, unknown, and unequal local sets", () => {
  const valid = {
    expectedBlocksRevision: 1,
    baselineOrder: ["a", "b"],
    localOrder: ["b", "a"],
  };
  assert.equal(ReorderBlocksIntentSchema.safeParse(valid).success, true);
  for (const localOrder of [
    ["a", "a"],
    ["a", ""],
    ["a", "other"],
    ["a"],
  ]) {
    assert.equal(
      ReorderBlocksIntentSchema.safeParse({ ...valid, localOrder }).success,
      false,
    );
  }
});
