/**
 * @file apps/studio/src/features/builder/builder-block-recreation.test.ts
 * @layer studio/features/builder
 * @description Builder recreation conflict workflow tests.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { runBuilderBlockRecreation } from "@compoz/studio/features/builder/builder-block-recreation";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

void test("a create 409 exposes its conflict without navigation or local-content loss", async () => {
  const values: SectionBlockFormValues = {
    name: "Local draft",
    containerMode: "contained",
    cssClassName: "",
    lcpPriority: false,
    rows: [{
      id: "local-row",
      columnsCount: 1,
      reverseOn: { mobile: false, tablet: false, desktop: false },
      columns: [{ id: "local-column", cells: [] }],
    }],
  };
  const before = JSON.stringify(values);
  let visibleConflict: PageBlocksConflictDetails | null = null;
  let navigation: string | null = null;
  const conflict: PageBlocksConflictDetails = {
    resourceId: "page",
    expectedBlocksRevision: 1,
    currentBlocksRevision: 2,
    operation: "create",
    conflictKind: "functional",
    conflictingPaths: ["placement"],
    conflicts: [{ kind: "anchorMissing", path: "placement", id: "gone" }],
    current: { blocks: [], blocksRevision: 2 },
  };

  await assert.rejects(
    runBuilderBlockRecreation({
      values,
      create: async ({ values: submitted }) => {
        assert.strictEqual(submitted, values);
        visibleConflict = conflict;
        throw new Error("409");
      },
      onSuccess: (createdBlockId) => {
        navigation = createdBlockId;
      },
    }),
  );

  assert.strictEqual(visibleConflict, conflict);
  assert.equal(navigation, null);
  assert.equal(JSON.stringify(values), before);
});
