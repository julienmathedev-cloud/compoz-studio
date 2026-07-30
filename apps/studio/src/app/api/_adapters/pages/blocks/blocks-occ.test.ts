/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/blocks-occ.test.ts
 * @layer studio/app/api/adapters
 * @description Exact OCC baseline preservation tests for block API adapters.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  preserveBaselineValue,
  preserveValidatedBlockBaseline,
  preserveValidatedRowsBaseline,
} from "@compoz/studio/app/api/_adapters/pages/blocks/block-baselines";
import type {
  DeleteBlockIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

const baselineBlock: DeleteBlockIntentDTO["baselineBlock"] = {
  id: "block",
  type: "section",
  name: " Persisted name ",
  containerMode: "contained",
  cssClassName: " persisted-class ",
  lcpPriority: false,
  rows: [{
    id: "row",
    columnsCount: 1,
    reverseOn: { mobile: false, tablet: false, desktop: false },
    columns: [{
      id: "column",
      cells: [{
        id: "rich",
        kind: "richText",
        content: "  <p>persisted</p>\n",
        reveal: false,
      }],
    }],
  }],
};

void test("update baseline helpers preserve every validated value by identity", () => {
  const dto: UpdateSectionBlockIntentDTO = {
    expectedBlocksRevision: 2,
    baselineLcpPriorityBlockId: null,
    changes: {
      name: {
        baseline: baselineBlock.name,
        local: " Local name ",
      },
      cssClassName: {
        baseline: baselineBlock.cssClassName,
        local: " local-class ",
      },
      rows: {
        baseline: baselineBlock.rows,
        local: baselineBlock.rows,
      },
    },
  };
  assert.equal(
    preserveBaselineValue(dto.changes.name?.baseline),
    " Persisted name ",
  );
  assert.equal(
    preserveBaselineValue(dto.changes.cssClassName?.baseline),
    " persisted-class ",
  );
  const rows = preserveValidatedRowsBaseline(dto.changes.rows!.baseline);
  assert.strictEqual(rows, dto.changes.rows?.baseline);
  const rich = rows[0]?.columns[0]?.cells[0];
  assert.equal(
    rich?.kind === "richText" ? rich.content : null,
    "  <p>persisted</p>\n",
  );
});

void test("delete forwards the validated cache snapshot without remapping it", () => {
  const dto: DeleteBlockIntentDTO = {
    expectedBlocksRevision: 2,
    baselineBlock,
  };
  const adapted = preserveValidatedBlockBaseline(dto.baselineBlock);
  assert.strictEqual(adapted, dto.baselineBlock);
  assert.deepEqual(adapted, baselineBlock);
});
