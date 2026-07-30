/**
 * @file apps/studio/src/features/pages/mappers/blocks-form-occ.test.ts
 * @layer studio/features/pages/mappers
 * @description OCC baseline preservation tests for block form intents.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import { mergeSectionBlock } from "@compoz/core/domain/pages/revisions/page-blocks-merge";
import {
  toSectionBlockFormValuesFromDTO,
  toUpdateSectionBlockIntentDTOFromFormValues,
} from "@compoz/studio/features/pages/mappers/blocks-form";

void test("an editable row projected from persisted rows=[] remains a local addition", () => {
  const persistedBlock: SectionBlock = {
    id: "block",
    type: "section",
    name: "Empty",
    containerMode: "contained",
    lcpPriority: false,
    rows: [],
  };
  const projected = toSectionBlockFormValuesFromDTO(persistedBlock);
  assert.equal(projected.rows.length, 1);
  const local = {
    ...projected,
    rows: [{
      ...projected.rows[0]!,
      reverseOn: {
        ...projected.rows[0]!.reverseOn,
        mobile: true,
      },
    }],
  };
  const intent = toUpdateSectionBlockIntentDTOFromFormValues({
    baselineBlock: persistedBlock,
    local,
    expectedBlocksRevision: 3,
    baselineLcpPriorityBlockId: null,
  });

  assert.deepEqual(intent.changes.rows?.baseline, []);
  assert.equal(intent.changes.rows?.local.length, 1);
  const merged = mergeSectionBlock({
    baseline: persistedBlock,
    current: persistedBlock,
    local: {
      ...persistedBlock,
      rows:
        (intent.changes.rows?.local ??
          []) as unknown as SectionBlock["rows"],
    },
  });
  assert.deepEqual(merged.conflicts, []);
  assert.equal(merged.candidate.rows.length, 1);
});

void test("rich text baseline content is emitted byte-for-byte from the persisted block", () => {
  const persistedBlock: SectionBlock = {
    id: "block",
    type: "section",
    name: "Rich",
    containerMode: "contained",
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
  const local = toSectionBlockFormValuesFromDTO(persistedBlock);
  const rich = local.rows[0]!.columns[0]!.cells[0]!;
  assert.equal(rich.kind, "richText");
  if (rich.kind !== "richText") return;
  rich.content = "<p>local</p>";

  const intent = toUpdateSectionBlockIntentDTOFromFormValues({
    baselineBlock: persistedBlock,
    local,
    expectedBlocksRevision: 1,
    baselineLcpPriorityBlockId: null,
  });
  const baselineRich =
    intent.changes.rows?.baseline[0]?.columns[0]?.cells[0];
  assert.equal(baselineRich?.kind, "richText");
  assert.equal(
    baselineRich?.kind === "richText" ? baselineRich.content : null,
    "  <p>persisted</p>\n",
  );
});
