/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-conflict-presentation.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Tests user-facing block conflict labels without exposing OCC paths or ids.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { BlockConflict, BlockFieldConflict, PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { blockInvariantPresentationKey, describeBlockFieldLocation, selectBlockConflictPanelScenario, toBlockConflictPresentation } from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";

const block = {
  id: "block-internal-id",
  type: "section" as const,
  name: "Hero",
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [{
    id: "row-internal-id",
    columnsCount: 1 as const,
    reverseOn: { mobile: false, tablet: false, desktop: false },
    columns: [{ id: "column-internal-id", cells: [] }],
  }],
};

const details: PageBlocksConflictDetails = {
  resourceId: "page",
  expectedBlocksRevision: 1,
  currentBlocksRevision: 2,
  operation: "update",
  conflictKind: "functional",
  conflictingPaths: ["blocks[block-internal-id].rows[row-internal-id]"],
  conflicts: [{
    kind: "fieldConflict",
    path: "blocks[block-internal-id].rows[row-internal-id].title",
    location: {
      kind: "blockField",
      blockId: "block-internal-id",
      segments: [{ kind: "row", id: "row-internal-id" }, { kind: "field", name: "title" }],
    },
    baseline: "<p>Base</p>",
    current: "<p>Saved</p>",
    local: "<p>Local</p>",
  }, {
    kind: "fieldConflict",
    path: "blocks.lcpOwner",
    location: { kind: "globalLcpOwner" },
    baseline: null,
    current: "block-internal-id",
    local: null,
  }, {
    kind: "orderIncompatible",
    path: "blocks.order",
    baselineOrder: [],
    currentOrder: ["block-internal-id"],
    localOrder: ["missing-local-id"],
    addedBlockIds: ["block-internal-id"],
    removedBlockIds: ["missing-removed-id"],
  }],
  current: { blocks: [block], blocksRevision: 2 },
};

const t = (key: string, values?: Record<string, string | number>) => {
  if (key === "blocks.named") return `Block ${values?.name}`;
  if (key === "locations.row") return `Row ${values?.position}`;
  if (key === "locations.column") return `Column ${values?.position}`;
  if (key === "locations.cellTyped") return `Cell ${values?.type}`;
  if (key === "locations.field") return `Field ${values?.name}`;
  if (key === "fields.title") return "Title";
  if (key === "blocks.missing") return "Missing block";
  if (key === "blocks.none") return "No block";
  if (key === "types.section") return "Section";
  if (key === "types.heading") return "Heading";
  if (key === "types.richText") return "Rich text";
  if (key === "types.image") return "Image";
  if (key === "types.form") return "Form";
  if (key === "types.cardCollection") return "Card collection";
  if (key === "types.card") return "Card";
  if (key === "types.extendedCard") return "Extended card";
  if (key === "types.structuredCard") return "Structured card";
  return key;
};

void test("formats typed locations, LCP owners, rich text, and order details safely", () => {
  const items = toBlockConflictPresentation(details, t)[0]?.items ?? [];
  const field = items[0];
  assert.match(field?.label ?? "", /Block Hero · Row 1 · Field Title/);
  assert.equal(field?.comparison?.server.kind, "rich-text");
  assert.equal(field?.comparison?.server.kind === "rich-text" ? field.comparison.server.text : "", "Saved");
  const lcp = items.find((item) => item.label === "locations.lcpOwner");
  const order = items.find((item) => item.label === "order.titles.blocks");
  assert.equal(lcp?.comparison?.server.kind === "text" ? lcp.comparison.server.text : "", "Block Hero");
  assert.deepEqual(order?.orderComparison, {
    baseline: [],
    server: ["Block Hero"],
    local: ["Missing block"],
  });
  assert.doesNotMatch(JSON.stringify(items), /block-internal-id|row-internal-id|blocks\[/);
});

const nestedBlock: Block = {
  ...block,
  rows: [{
    ...block.rows[0]!,
    columns: [{
      ...block.rows[0]!.columns[0]!,
      cells: [{
        id: "form-cell-id",
        kind: "form",
        to: "contact@example.test",
        submitButton: { label: "Send", variant: "default", icon: null, iconPosition: "before" },
        successMessage: null,
        errorMessage: null,
        fields: [{ id: "form-field-id", name: "email", label: "Email address", placeholder: "you@example.test", required: true, type: "email" }],
      }, {
        id: "cards-cell-id",
        kind: "cardCollection",
        cardKind: "structuredCard",
        columns: 2,
        align: "left",
        reveal: false,
        items: [{
          id: "item-id",
          title: "Audit offer",
          meta: null,
          image: { id: "image-id", src: "/audit.jpg", alt: "Main illustration", width: 800, height: 600, caption: null, href: null },
          sections: [{ id: "section-id", label: "Header", content: "Content" }],
          button: null,
        }],
      }],
    }],
  }],
};

void test("cell order conflicts use cell labels and preserve all three orders", () => {
  const formCell = nestedBlock.rows[0]!.columns[0]!.cells[0]!;
  const cardsCell = nestedBlock.rows[0]!.columns[0]!.cells[1]!;
  const richCell = {
    id: "rich-cell-id",
    kind: "richText" as const,
    content: "<p>Content</p>",
    reveal: false,
  };
  const orderBlock: Block = {
    ...nestedBlock,
    rows: [{
      ...nestedBlock.rows[0]!,
      columns: [{
        ...nestedBlock.rows[0]!.columns[0]!,
        cells: [formCell, cardsCell, richCell],
      }],
    }],
  };
  const orderDetails: PageBlocksConflictDetails = {
    ...details,
    conflicts: [{
      kind: "orderIncompatible",
      path: "blocks[block-internal-id].rows[row-internal-id].columns[column-internal-id].cells",
      baselineOrder: ["form-cell-id", "cards-cell-id", "rich-cell-id"],
      currentOrder: ["cards-cell-id", "form-cell-id", "rich-cell-id"],
      localOrder: ["form-cell-id", "rich-cell-id", "cards-cell-id"],
      addedBlockIds: [],
      removedBlockIds: [],
    }],
    current: { blocks: [orderBlock], blocksRevision: 2 },
    candidateBlock: orderBlock,
  };
  const translate = (key: string, values?: Record<string, string | number>) =>
    key === "order.titles.cells" ? "Ordre des cellules" : t(key, values);
  const item = toBlockConflictPresentation(orderDetails, translate, {
    currentBlocks: [orderBlock],
    candidateBlock: orderBlock,
  })[0]?.items[0];

  assert.equal(item?.label, "Ordre des cellules");
  assert.deepEqual(item?.orderComparison, {
    baseline: ["Cell Form", "Cell Card collection", "Cell Rich text"],
    server: ["Cell Card collection", "Cell Form", "Cell Rich text"],
    local: ["Cell Form", "Cell Rich text", "Cell Card collection"],
  });
  assert.doesNotMatch(JSON.stringify(item), /Missing block|Bloc introuvable/u);
});

function locationConflict(segments: Extract<BlockFieldConflict["location"], { kind: "blockField" }>["segments"]): BlockFieldConflict {
  return {
    kind: "fieldConflict",
    path: "opaque-test-path",
    location: { kind: "blockField", blockId: nestedBlock.id, segments },
    baseline: "a",
    current: "b",
    local: "c",
  };
}

void test("locates every nested block resource by business name and reports missing resources honestly", () => {
  const context = { currentBlocks: [nestedBlock] };
  const found = describeBlockFieldLocation(locationConflict([
    { kind: "row", id: "row-internal-id" },
    { kind: "column", id: "column-internal-id" },
    { kind: "cell", id: "cards-cell-id" },
    { kind: "identifiedItem", id: "item-id" },
    { kind: "structuredCardSection", id: "section-id" },
    { kind: "field", name: "content" },
  ]), context, t);
  assert.match(found, /Block Hero · Row 1 · Column 1/u);
  assert.match(found, /Cell Card collection|locations\.cellNamed/u);
  assert.match(found, /locations\.itemNamed/u);
  assert.match(found, /locations\.structuredSectionNamed/u);

  const form = describeBlockFieldLocation(locationConflict([
    { kind: "row", id: "row-internal-id" },
    { kind: "column", id: "column-internal-id" },
    { kind: "cell", id: "form-cell-id" },
    { kind: "formField", id: "form-field-id" },
    { kind: "field", name: "label" },
  ]), context, t);
  assert.match(form, /locations\.formFieldNamed/u);

  const image = describeBlockFieldLocation(locationConflict([
    { kind: "row", id: "row-internal-id" },
    { kind: "column", id: "column-internal-id" },
    { kind: "cell", id: "cards-cell-id" },
    { kind: "identifiedItem", id: "item-id" },
    { kind: "image" },
    { kind: "field", name: "alt" },
  ]), context, t);
  assert.match(image, /locations\.imageNamed/u);

  const missing = describeBlockFieldLocation(locationConflict([
    { kind: "row", id: "missing-row" },
    { kind: "column", id: "missing-column" },
    { kind: "cell", id: "missing-cell" },
    { kind: "identifiedItem", id: "missing-item" },
    { kind: "formField", id: "missing-field" },
    { kind: "structuredCardSection", id: "missing-section" },
    { kind: "image" },
    { kind: "field", name: "title" },
  ]), context, t);
  assert.match(missing, /locations\.rowMissing/u);
  assert.match(missing, /locations\.columnMissing/u);
  assert.match(missing, /locations\.cellDeleted/u);
  assert.match(missing, /locations\.itemMissing/u);
  assert.match(missing, /locations\.formFieldDeleted/u);
  assert.match(missing, /locations\.structuredSectionMissing/u);
  assert.match(missing, /locations\.imageDeleted/u);
  assert.doesNotMatch(missing, /missing-row|missing-column|missing-cell| 1 ·/u);
});

void test("classifies reused identifiers for every supported resource without exposing the identifier", () => {
  const paths = [
    ["blocks[reuse]", "idReused.block"],
    ["blocks[b].rows[reuse]", "idReused.row"],
    ["blocks[b].rows[r].columns[reuse]", "idReused.column"],
    ["blocks[b].rows[r].columns[c].cells[reuse]", "idReused.cell"],
    ["blocks[b].rows[r].columns[c].cells[x].items[reuse]", "idReused.item"],
    ["blocks[b].rows[r].columns[c].cells[x].fields[reuse]", "idReused.formField"],
    ["other[reuse]", "idReused.unknown"],
  ] as const;
  for (const [path, expectedLabel] of paths) {
    const current: PageBlocksConflictDetails = { ...details, conflicts: [{ kind: "idReused", path, id: "secret-resource-id" }] };
    const item = toBlockConflictPresentation(current, t)[0]?.items[0];
    assert.equal(item?.label, expectedLabel);
    assert.doesNotMatch(JSON.stringify(item), /secret-resource-id/u);
  }
});

void test("presents every structural conflict branch with semantic comparisons or details", () => {
  const structural: PageBlocksConflictDetails = {
    ...details,
    conflicts: [
      { kind: "blockDeleted", path: "blocks[block-internal-id]", blockId: "block-internal-id" },
      { kind: "blockChangedBeforeDelete", path: "blocks[block-internal-id]", blockId: "block-internal-id", baseline: block, current: { ...block, name: "Saved Hero" } },
      { kind: "blockTypeChanged", path: "blocks[block-internal-id].type", baseline: "section", current: "section", local: "section" },
      { kind: "cellTypeChanged", path: "blocks[block-internal-id].rows[r].columns[c].cells[x]", baseline: { kind: "heading", title: "A" }, current: { kind: "richText", content: "B" }, local: { kind: "image", alt: "C" } },
      { kind: "itemTypeChanged", path: "blocks[block-internal-id].rows[r].columns[c].cells[x].items[i].type", baseline: "card", current: "extendedCard", local: "structuredCard" },
      { kind: "collectionIncompatible", path: "blocks[block-internal-id].rows", baseline: [], current: [{ name: "Saved" }], local: [{ name: "Local" }] },
      { kind: "anchorMissing", path: "placement", id: "gone-anchor" },
      { kind: "globalInvariant", path: "blocks", invariant: "BLOCKS_INVALID" },
      { kind: "revisionAhead", path: "blocksRevision", expectedBlocksRevision: 2, currentBlocksRevision: 4 },
    ],
  };
  const items = toBlockConflictPresentation(structural, t, { currentBlocks: [block], baselineBlocks: [block], candidateBlock: { ...block, id: "candidate", name: "Candidate" } })[0]?.items ?? [];
  assert.equal(items.length, structural.conflicts.length);
  assert.ok(items.every((item) => item.comparison || (item.details?.length ?? 0) > 0));
  assert.equal(items.find((item) => item.label === "kinds.revisionAhead")?.comparison, undefined);
  assert.equal(items.find((item) => item.label === "kinds.anchorMissing")?.comparison, undefined);
  for (const kind of ["blockTypeChanged", "cellTypeChanged", "itemTypeChanged"] as const) {
    const item = items.find((candidate) => candidate.label === `kinds.${kind}`);
    assert.equal(item?.resolutionMode, "choice");
    assert.deepEqual(item?.details?.map((detail) => detail.label), ["structural.initialType", "structural.savedType", "structural.localType"]);
  }
  const cellTypes = items.find((item) => item.label === "kinds.cellTypeChanged")?.details?.map((detail) => detail.value.kind === "text" ? detail.value.text : "");
  assert.deepEqual(cellTypes, ["Heading", "Rich text", "Image"]);
  const itemTypes = items.find((item) => item.label === "kinds.itemTypeChanged")?.details?.map((detail) => detail.value.kind === "text" ? detail.value.text : "");
  assert.deepEqual(itemTypes, ["Card", "Extended card", "Structured card"]);
  const collection = items.find((item) => item.label === "kinds.collectionIncompatible");
  assert.deepEqual(collection?.details?.map((detail) => detail.id), ["operation", "saved-state", "reason"]);
  assert.doesNotMatch(JSON.stringify(items), /gone-anchor|blocks\[/u);
});

void test("maps every known global invariant category and safely hides unknown codes", () => {
  assert.equal(blockInvariantPresentationKey("BLOCKS_INVALID"), "invalidStructure");
  assert.equal(blockInvariantPresentationKey("BLOCKS_MULTIPLE_LCP_DETECTED"), "multipleLcp");
  assert.equal(blockInvariantPresentationKey("HEADING_CELL_UNIQUE_H1"), "multipleH1");
  assert.equal(blockInvariantPresentationKey("BLOCK_COLUMNS_COUNT_MISMATCH"), "columnsMismatch");
  assert.equal(blockInvariantPresentationKey("CELL_ITEM_ID_DUPLICATE"), "duplicateResource");
  assert.equal(blockInvariantPresentationKey("FUTURE_PRIVATE_CODE"), "invalidCombination");

  const invariantDetails: PageBlocksConflictDetails = {
    ...details,
    conflicts: [
      { kind: "globalInvariant", path: "blocks", invariant: "BLOCKS_MULTIPLE_LCP_DETECTED" },
      { kind: "globalInvariant", path: "blocks", invariant: "HEADING_CELL_UNIQUE_H1" },
      { kind: "globalInvariant", path: "blocks", invariant: "FUTURE_PRIVATE_CODE" },
    ],
  };
  const items = toBlockConflictPresentation(invariantDetails, t)[0]?.items ?? [];
  const serialized = JSON.stringify(items);
  assert.match(serialized, /invariants\.multipleLcp|invariants\.multipleH1|invariants\.invalidCombination/);
  assert.doesNotMatch(serialized, /BLOCKS_MULTIPLE_LCP_DETECTED|HEADING_CELL_UNIQUE_H1|FUTURE_PRIVATE_CODE/);
});

void test("separates remote and local order changes and resolves candidate block names", () => {
  const candidate = { ...block, id: "candidate-id", name: "Candidate" };
  const orderDetails: PageBlocksConflictDetails = {
    ...details,
    candidateBlock: candidate,
    conflicts: [{
      kind: "orderIncompatible",
      path: "blocks",
      baselineOrder: [block.id, "removed-both"],
      currentOrder: ["server-added", block.id],
      localOrder: [block.id, candidate.id],
      addedBlockIds: ["server-added"],
      removedBlockIds: ["removed-both"],
    }],
  };
  const serverAdded = { ...block, id: "server-added", name: "Server addition" };
  const item = toBlockConflictPresentation(orderDetails, t, { currentBlocks: [block, serverAdded], baselineBlocks: [block], localBlocks: [block, candidate], candidateBlock: candidate })[0]?.items[0];
  assert.ok(item?.details?.some((detail) => detail.id === "added-server"));
  assert.ok(item?.details?.some((detail) => detail.id === "removed-server"));
  const localAdded = item?.details?.find((detail) => detail.id === "added-local")?.value;
  assert.deepEqual(localAdded, { kind: "list", items: ["Block Candidate"] });
  assert.ok(item?.details?.some((detail) => detail.id === "removed-local"));
  assert.doesNotMatch(JSON.stringify(item), /candidate-id|server-added|removed-both/u);
});

void test("normalizes every block conflict to an explicit binary choice", () => {
  const items = toBlockConflictPresentation(details, t, { currentBlocks: [block] })[0]?.items ?? [];
  assert.ok(items.every((item) => item.resolutionMode === "choice"));
  assert.ok(items.every((item) => item.choice === undefined));
});

void test("selects deterministic panel copy and action mode by scenario priority", () => {
  const scenarios: readonly Readonly<{
    conflict: BlockConflict;
    conflictKind?: PageBlocksConflictDetails["conflictKind"];
    expected: string;
    actionMode: "choices" | "reload";
  }>[] = [
    { conflict: details.conflicts[0]!, expected: "field", actionMode: "choices" },
    { conflict: { kind: "blockDeleted", path: "blocks[b]", blockId: "b" }, expected: "blockDeleted", actionMode: "choices" },
    { conflict: { kind: "blockChangedBeforeDelete", path: "blocks[b]", blockId: "b", baseline: block, current: { ...block, name: "Saved" } }, expected: "blockChangedBeforeDelete", actionMode: "choices" },
    { conflict: details.conflicts[0]!, conflictKind: "contention", expected: "contention", actionMode: "choices" },
    { conflict: { kind: "revisionAhead", path: "blocksRevision", expectedBlocksRevision: 4, currentBlocksRevision: 3 }, expected: "revisionAhead", actionMode: "reload" },
    { conflict: { kind: "idReused", path: "blocks[b]", id: "b" }, expected: "idReused", actionMode: "choices" },
    { conflict: { kind: "globalInvariant", path: "blocks", invariant: "BLOCKS_INVALID" }, expected: "globalInvariant", actionMode: "reload" },
    { conflict: details.conflicts[2]!, expected: "orderIncompatible", actionMode: "choices" },
  ];

  for (const scenario of scenarios) {
    const selected = selectBlockConflictPanelScenario({
      ...details,
      conflictKind: scenario.conflictKind ?? "functional",
      conflicts: [scenario.conflict],
    });
    assert.equal(selected.kind, scenario.expected);
    assert.equal(selected.actionMode, scenario.actionMode);
  }

  const priority = selectBlockConflictPanelScenario({
    ...details,
    conflictKind: "contention",
    conflicts: [
      { kind: "blockDeleted", path: "blocks[b]", blockId: "b" },
      { kind: "globalInvariant", path: "blocks", invariant: "BLOCKS_INVALID" },
      { kind: "revisionAhead", path: "blocksRevision", expectedBlocksRevision: 4, currentBlocksRevision: 3 },
    ],
  });
  assert.equal(priority.kind, "revisionAhead");
});

void test("uses the specialized choice labels for block scenarios", () => {
  const choices = (conflict: BlockConflict, conflictKind: PageBlocksConflictDetails["conflictKind"] = "functional") =>
    toBlockConflictPresentation({ ...details, conflictKind, conflicts: [conflict] }, t)[0]?.items[0]?.options;

  assert.deepEqual(choices({ kind: "blockDeleted", path: "blocks[b]", blockId: "b" }), {
    server: "choices.keepDeletion",
    local: "choices.recreateBlock",
  });
  assert.deepEqual(choices({ kind: "blockChangedBeforeDelete", path: "blocks[b]", blockId: "b", baseline: block, current: block }), {
    server: "choices.keepSavedVersion",
    local: "choices.confirmDeletion",
  });
  assert.deepEqual(choices({ kind: "idReused", path: "blocks[b]", id: "b" }), {
    server: "choices.keepSavedVersion",
    local: "choices.keepMyChange",
  });
  assert.deepEqual(choices(details.conflicts[2]!), {
    server: "choices.useSavedOrder",
    local: "choices.keepLocalOrder",
  });
  assert.deepEqual(choices(details.conflicts[0]!, "contention"), undefined);
  const contentionItems = toBlockConflictPresentation({ ...details, conflictKind: "contention", conflicts: [] }, t)[0]?.items ?? [];
  assert.deepEqual(contentionItems[0]?.options, {
    server: "choices.keepSavedVersion",
    local: "choices.retryDraft",
  });
});

void test("uses the validated French and English action and order labels", () => {
  type Messages = Readonly<{
    studio: Readonly<{
      pageBlocksConflict: Readonly<Record<string, unknown>>;
    }>;
  }>;
  const translator = (locale: "fr" | "en") => {
    const messages = JSON.parse(readFileSync(
      `apps/studio/src/i18n/messages/${locale}.json`,
      "utf8",
    )) as Messages;
    return (key: string): string => {
      let value: unknown = messages.studio.pageBlocksConflict;
      for (const segment of key.split(".")) {
        value = typeof value === "object" && value !== null
          ? (value as Readonly<Record<string, unknown>>)[segment]
          : undefined;
      }
      return typeof value === "string" ? value : key;
    };
  };
  const structural = (
    kind: "blockTypeChanged" | "cellTypeChanged" | "itemTypeChanged" | "collectionIncompatible",
  ): BlockConflict => ({
    kind,
    path: `blocks[block-internal-id].${kind}`,
    baseline: null,
    current: null,
    local: null,
  });
  const keepChangeConflicts: readonly BlockConflict[] = [
    { kind: "idReused", path: "blocks[block-internal-id]", id: "block-internal-id" },
    structural("blockTypeChanged"),
    structural("cellTypeChanged"),
    structural("itemTypeChanged"),
    structural("collectionIncompatible"),
  ];

  for (const [locale, retryDraft, keepMyChange, orderTitles] of [
    ["fr", "Réessayer avec mon brouillon", "Conserver ma modification", ["Ordre des blocs", "Ordre des lignes", "Ordre des colonnes", "Ordre des cellules", "Ordre des éléments", "Ordre des champs", "Ordre des sections"]],
    ["en", "Try again with my draft", "Keep my change", ["Block order", "Row order", "Column order", "Cell order", "Item order", "Field order", "Section order"]],
  ] as const) {
    const translate = translator(locale);
    assert.deepEqual(
      ["blocks", "rows", "columns", "cells", "items", "fields", "sections"].map(
        (collection) => translate(`order.titles.${collection}`),
      ),
      orderTitles,
    );
    const contention = toBlockConflictPresentation({
      ...details,
      conflictKind: "contention",
      conflicts: [],
    }, translate)[0]?.items[0];
    const anchor = toBlockConflictPresentation({
      ...details,
      conflicts: [{ kind: "anchorMissing", path: "placement", id: "gone" }],
    }, translate)[0]?.items[0];
    assert.equal(contention?.options?.local, retryDraft);
    assert.equal(anchor?.options?.local, retryDraft);

    for (const conflict of keepChangeConflicts) {
      const item = toBlockConflictPresentation({
        ...details,
        conflicts: [conflict],
      }, translate)[0]?.items[0];
      assert.equal(item?.options?.local, keepMyChange, `${locale}:${conflict.kind}`);
    }
  }
});
