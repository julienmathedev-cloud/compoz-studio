/**
 * @file apps/studio/src/features/pages/blocks/conflicts/resolve-block-conflict.test.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Tests explicit local/remote resolution against the server candidate.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { resolveBlockConflictCandidate } from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";

const block = {
  id: "block",
  type: "section" as const,
  name: "Local",
  containerMode: "contained" as const,
  lcpPriority: false,
  rows: [{
    id: "row",
    columnsCount: 1 as const,
    reverseOn: { mobile: false, tablet: false, desktop: false },
    columns: [{
      id: "column",
      cells: [{
        id: "rich",
        kind: "richText" as const,
        content: "<p>local</p>",
        reveal: false,
      }],
    }],
  }],
};

const details: PageBlocksConflictDetails = {
  resourceId: "page",
  expectedBlocksRevision: 1,
  currentBlocksRevision: 2,
  operation: "update",
  conflictKind: "functional",
  conflictingPaths: [
    "blocks[block].name",
    "blocks[block].rows[row].columns[column].cells[rich].content",
  ],
  conflicts: [
    {
      kind: "fieldConflict",
      path: "blocks[block].name",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [{ kind: "field", name: "name" }],
      },
      baseline: "Base",
      current: "Remote",
      local: "Local",
    },
    {
      kind: "fieldConflict",
      path:
        "blocks[block].rows[row].columns[column].cells[rich].content",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          { kind: "row", id: "row" },
          { kind: "column", id: "column" },
          { kind: "cell", id: "rich" },
          { kind: "field", name: "content" },
        ],
      },
      baseline: "<p>base</p>",
      current: "<p>remote</p>",
      local: "<p>local</p>",
    },
  ],
  current: { blocks: [{ ...block, name: "Remote" }], blocksRevision: 2 },
  candidateBlock: block,
};

void test("keepLocal preserves candidate and adoptRemote replaces selected paths", () => {
  const resolved = resolveBlockConflictCandidate({
    details,
    choices: { 0: "remote", 1: "local" },
  });
  assert.equal(resolved?.name, "Remote");
  const rich = resolved?.rows[0]?.columns[0]?.cells[0];
  assert.equal(rich?.kind, "richText");
  if (rich?.kind === "richText") {
    assert.equal(rich.content, "<p>local</p>");
  }
});

void test("missing candidate cannot silently manufacture a block", () => {
  assert.equal(
    resolveBlockConflictCandidate({
      details: { ...details, candidateBlock: undefined },
      choices: {},
    }),
    null,
  );
});

void test("typed locations adopt every remotely resolvable field kind", () => {
  const candidate = {
    id: "block",
    type: "section",
    name: "Local",
    containerMode: "contained",
    lcpPriority: false,
    rows: [{
      id: "row",
      columnsCount: 1,
      reverseOn: { mobile: false, tablet: false, desktop: false },
      columns: [{
        id: "column",
        cells: [
          {
            id: "rich",
            kind: "richText",
            content: "<p>local</p>",
            reveal: false,
          },
          {
            id: "image",
            kind: "image",
            image: {
              id: "image-item",
              src: "/local.jpg",
              alt: "Local alt",
              width: 100,
              height: 100,
              mediaAssetId: "local-asset",
              caption: null,
              href: null,
            },
            variant: "default",
            size: "md",
            reveal: false,
            zoomEnabled: false,
          },
          {
            id: "steps",
            kind: "steps",
            variant: "vertical",
            items: [{
              id: "step",
              title: "Local title",
              description: "Description",
            }],
          },
          {
            id: "form",
            kind: "form",
            to: "mail@example.test",
            submitButton: {
              label: "Send",
              variant: "default",
              icon: null,
              iconPosition: "before",
            },
            successMessage: null,
            errorMessage: null,
            fields: [{
              id: "field",
              type: "text",
              name: "name",
              label: "Local label",
              placeholder: null,
              required: false,
            }],
          },
          {
            id: "cards",
            kind: "cardCollection",
            cardKind: "structuredCard",
            columns: 1,
            align: "left",
            reveal: false,
            items: [{
              id: "card",
              image: null,
              title: "Card",
              meta: null,
              sections: [{
                id: "section",
                label: "Section",
                content: "Local content",
              }],
              button: null,
            }],
          },
        ],
      }],
    }],
  } satisfies SectionBlock;
  const rowPrefix = [
    { kind: "row", id: "row" },
  ] as const;
  const cellPrefix = (cellId: string) => [
    ...rowPrefix,
    { kind: "column" as const, id: "column" },
    { kind: "cell" as const, id: cellId },
  ];
  const conflicts: PageBlocksConflictDetails["conflicts"] = [
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columnsCount",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [...rowPrefix, { kind: "field", name: "columnsCount" }],
      },
      baseline: 1,
      current: 1,
      local: 1,
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].reverseOn.mobile",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...rowPrefix,
          { kind: "field", name: "reverseOn" },
          { kind: "field", name: "mobile" },
        ],
      },
      baseline: false,
      current: true,
      local: false,
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[rich].content",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("rich"),
          { kind: "field", name: "content" },
        ],
      },
      baseline: "<p>base</p>",
      current: "<p>remote</p>",
      local: "<p>local</p>",
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[image].image.media",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("image"),
          { kind: "image" },
          { kind: "field", name: "media" },
        ],
      },
      baseline: null,
      current: {
        src: "/remote.jpg",
        width: 200,
        height: 150,
        mediaAssetId: "remote-asset",
      },
      local: null,
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[image].image.alt",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("image"),
          { kind: "image" },
          { kind: "field", name: "alt" },
        ],
      },
      baseline: "Base alt",
      current: "Remote alt",
      local: "Local alt",
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[steps].items[step].title",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("steps"),
          { kind: "identifiedItem", id: "step" },
          { kind: "field", name: "title" },
        ],
      },
      baseline: "Base title",
      current: "Remote title",
      local: "Local title",
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[form].fields[field].label",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("form"),
          { kind: "formField", id: "field" },
          { kind: "field", name: "label" },
        ],
      },
      baseline: "Base label",
      current: "Remote label",
      local: "Local label",
    },
    {
      kind: "fieldConflict",
      path: "blocks[block].rows[row].columns[column].cells[cards].items[card].sections[section].content",
      location: {
        kind: "blockField",
        blockId: "block",
        segments: [
          ...cellPrefix("cards"),
          { kind: "identifiedItem", id: "card" },
          { kind: "structuredCardSection", id: "section" },
          { kind: "field", name: "content" },
        ],
      },
      baseline: "Base content",
      current: "Remote content",
      local: "Local content",
    },
    {
      kind: "fieldConflict",
      path: "blocks.lcpPriority",
      location: { kind: "globalLcpOwner" },
      baseline: null,
      current: "block",
      local: null,
    },
  ];
  const locationDetails: PageBlocksConflictDetails = {
    resourceId: "page",
    expectedBlocksRevision: 1,
    currentBlocksRevision: 2,
    operation: "update",
    conflictKind: "functional",
    conflictingPaths: conflicts.map((conflict) => conflict.path),
    conflicts,
    current: { blocks: [candidate], blocksRevision: 2 },
    candidateBlock: candidate,
  };
  const resolved = resolveBlockConflictCandidate({
    details: locationDetails,
    choices: Object.fromEntries(conflicts.map((_, index) => [index, "remote"])),
  });
  assert.ok(resolved);
  assert.equal(resolved.rows[0]?.columnsCount, 1);
  assert.equal(resolved.rows[0]?.reverseOn.mobile, true);
  const cells = resolved.rows[0]?.columns[0]?.cells ?? [];
  const rich = cells.find((cell) => cell.id === "rich");
  assert.equal(rich?.kind === "richText" ? rich.content : null, "<p>remote</p>");
  const image = cells.find((cell) => cell.id === "image");
  assert.equal(image?.kind === "image" ? image.image.src : null, "/remote.jpg");
  assert.equal(image?.kind === "image" ? image.image.alt : null, "Remote alt");
  const steps = cells.find((cell) => cell.id === "steps");
  assert.equal(
    steps?.kind === "steps" ? steps.items[0]?.title : null,
    "Remote title",
  );
  const form = cells.find((cell) => cell.id === "form");
  assert.equal(
    form?.kind === "form" ? form.fields[0]?.label : null,
    "Remote label",
  );
  const cards = cells.find((cell) => cell.id === "cards");
  assert.equal(
    cards?.kind === "cardCollection" &&
      "sections" in cards.items[0]!
      ? cards.items[0].sections[0]?.content
      : null,
    "Remote content",
  );
  assert.equal(resolved.lcpPriority, true);
});
