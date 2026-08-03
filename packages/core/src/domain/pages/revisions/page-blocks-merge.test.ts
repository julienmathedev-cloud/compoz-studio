/**
 * @file packages/core/src/domain/pages/revisions/page-blocks-merge.test.ts
 * @layer core/domain/pages/revisions
 * @description Focused pure tests for typed recursive block merging and order resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import {
  createPlacementOrder,
  mergeSectionBlock,
} from "@compoz/core/domain/pages/revisions/page-blocks-merge";
import {
  insertManyInStableInterval,
  resolveThreeWayOrder,
} from "@compoz/core/domain/pages/revisions/page-blocks-order";

function block(): SectionBlock {
  return {
    id: "block-a",
    type: "section",
    name: "Section",
    containerMode: "contained",
    lcpPriority: false,
    rows: [{
      id: "row-a",
      columnsCount: 2,
      reverseOn: { mobile: false, tablet: false, desktop: false },
      columns: [
        {
          id: "column-a",
          cells: [{
            id: "rich",
            kind: "richText",
            content: "<p>baseline</p>",
            reveal: false,
          }],
        },
        {
          id: "column-b",
          cells: [{
            id: "image",
            kind: "image",
            image: {
              id: "image-item",
              src: "/baseline.jpg",
              alt: "baseline alt",
              width: 100,
              height: 100,
              mediaAssetId: "asset-a",
              caption: null,
              href: null,
            },
            variant: "default",
            size: "md",
            reveal: false,
            zoomEnabled: false,
          }],
        },
      ],
    }],
  };
}

void test("different section properties merge and equal final values converge", () => {
  const baseline = block();
  const current = { ...baseline, name: "Remote" };
  const local = { ...baseline, containerMode: "fullBleed" as const };
  const result = mergeSectionBlock({ baseline, current, local });
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.candidate.name, "Remote");
  assert.equal(result.candidate.containerMode, "fullBleed");

  const converged = mergeSectionBlock({
    baseline,
    current: { ...baseline, name: "Final" },
    local: { ...baseline, name: "Final" },
  });
  assert.deepEqual(converged.conflicts, []);
  assert.equal(converged.candidate.name, "Final");
});

void test("same scalar and atomic rich text changes conflict with ID paths", () => {
  const baseline = block();
  const current = {
    ...baseline,
    name: "Remote",
    rows: [{
      ...baseline.rows[0],
      columns: [{
        ...baseline.rows[0].columns[0],
        cells: [{
          ...baseline.rows[0].columns[0].cells[0],
          content: "<p>remote</p>",
        }],
      }, baseline.rows[0].columns[1]],
    }],
  } as SectionBlock;
  const local = {
    ...baseline,
    name: "Local",
    rows: [{
      ...baseline.rows[0],
      columns: [{
        ...baseline.rows[0].columns[0],
        cells: [{
          ...baseline.rows[0].columns[0].cells[0],
          content: "<p>local</p>",
        }],
      }, baseline.rows[0].columns[1]],
    }],
  } as SectionBlock;
  const result = mergeSectionBlock({ baseline, current, local });
  assert.equal(result.conflicts.length, 2);
  assert.deepEqual(
    result.conflicts.map((item) => item.path),
    [
      "blocks[block-a].rows[row-a].columns[column-a].cells[rich].content",
      "blocks[block-a].name",
    ],
  );
  assert.equal(
    (
      result.candidate.rows[0].columns[0].cells[0] as {
        content: string;
      }
    ).content,
    "<p>local</p>",
  );
  assert.deepEqual(
    result.conflicts[0]?.kind === "fieldConflict"
      ? result.conflicts[0].location
      : null,
    {
      kind: "blockField",
      blockId: "block-a",
      segments: [
        { kind: "row", id: "row-a" },
        { kind: "column", id: "column-a" },
        { kind: "cell", id: "rich" },
        { kind: "field", name: "content" },
      ],
    },
  );
});

void test("image media is atomic while alt and caption merge independently", () => {
  const baseline = block();
  const baseImage = baseline.rows[0].columns[1].cells[0];
  assert.equal(baseImage.kind, "image");
  const remoteImage = {
    ...baseImage,
    image: { ...baseImage.image, alt: "remote alt" },
  };
  const localImage = {
    ...baseImage,
    image: { ...baseImage.image, caption: "local caption" },
  };
  const withImage = (image: typeof baseImage): SectionBlock => ({
    ...baseline,
    rows: [{
      ...baseline.rows[0],
      columns: [
        baseline.rows[0].columns[0],
        { ...baseline.rows[0].columns[1], cells: [image] },
      ],
    }],
  });
  const result = mergeSectionBlock({
    baseline,
    current: withImage(remoteImage),
    local: withImage(localImage),
  });
  assert.deepEqual(result.conflicts, []);
  const candidate = result.candidate.rows[0].columns[1].cells[0];
  assert.equal(candidate.kind, "image");
  assert.equal(candidate.image.alt, "remote alt");
  assert.equal(candidate.image.caption, "local caption");
});

void test("cell discriminant changes on both sides are incompatible", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const column = row.columns[0];
  const withCell = (cell: typeof column.cells[number]): SectionBlock => ({
    ...baseline,
    rows: [{ ...row, columns: [{ ...column, cells: [cell] }, row.columns[1]] }],
  });
  const current = withCell({
    id: "rich",
    kind: "spacer",
    size: "md",
    visibility: { mobile: true, tablet: true, desktop: true },
  });
  const local = withCell({
    id: "rich",
    kind: "separator",
    align: "center",
    size: "sm",
  });
  const result = mergeSectionBlock({ baseline, current, local });
  assert.equal(result.conflicts.some((item) => item.kind === "cellTypeChanged"), true);
});

void test("identified collection edits on different items merge and same-ID additions conflict", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const column = row.columns[0];
  const steps = {
    id: "steps",
    kind: "steps" as const,
    variant: "vertical" as const,
    items: [
      { id: "one", title: "One", description: "One" },
      { id: "two", title: "Two", description: "Two" },
    ],
  };
  const withSteps = (items: typeof steps.items): SectionBlock => ({
    ...baseline,
    rows: [{
      ...row,
      columns: [{ ...column, cells: [{ ...steps, items }] }, row.columns[1]],
    }],
  });
  const current = withSteps([
    { ...steps.items[0], title: "Remote one" },
    steps.items[1],
    { id: "shared", title: "Remote", description: "Remote" },
  ]);
  const local = withSteps([
    steps.items[0],
    { ...steps.items[1], description: "Local two" },
    { id: "shared", title: "Local", description: "Local" },
  ]);
  const result = mergeSectionBlock({ baseline: withSteps(steps.items), current, local });
  assert.equal(result.conflicts.some((item) => item.kind === "idReused"), true);
  const cell = result.candidate.rows[0].columns[0].cells[0];
  assert.equal(cell.kind, "steps");
  if (cell.kind === "steps") {
    assert.equal(cell.items.find((item) => item.id === "one")?.title, "Remote one");
    assert.equal(
      cell.items.find((item) => item.id === "two")?.description,
      "Local two",
    );
  }
});

void test("carousel, card collection, and form discriminants reject concurrent transformations", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const secondColumn = row.columns[1];
  const cells = {
    carousel: {
      baseline: {
        id: "variant",
        kind: "carousel" as const,
        variant: "carousel" as const,
        showDots: true,
        showArrows: true,
        itemKind: "card" as const,
        items: [],
      },
      current: {
        id: "variant",
        kind: "carousel" as const,
        variant: "carousel" as const,
        showDots: true,
        showArrows: true,
        itemKind: "extendedCard" as const,
        items: [],
      },
      local: {
        id: "variant",
        kind: "carousel" as const,
        variant: "carousel" as const,
        showDots: true,
        showArrows: true,
        itemKind: "structuredCard" as const,
        items: [],
      },
    },
    cards: {
      baseline: {
        id: "variant",
        kind: "cardCollection" as const,
        cardKind: "card" as const,
        columns: 2 as const,
        align: "left" as const,
        reveal: false,
        items: [],
      },
      current: {
        id: "variant",
        kind: "cardCollection" as const,
        cardKind: "extendedCard" as const,
        columns: 2 as const,
        align: "left" as const,
        reveal: false,
        items: [],
      },
      local: {
        id: "variant",
        kind: "cardCollection" as const,
        cardKind: "structuredCard" as const,
        columns: 2 as const,
        align: "left" as const,
        reveal: false,
        items: [],
      },
    },
  };
  for (const variant of [cells.carousel, cells.cards]) {
    const withCell = (
      cell: typeof variant.baseline | typeof variant.current | typeof variant.local,
    ): SectionBlock => ({
      ...baseline,
      rows: [{
        ...row,
        columns: [row.columns[0], { ...secondColumn, cells: [cell] }],
      }],
    });
    const result = mergeSectionBlock({
      baseline: withCell(variant.baseline),
      current: withCell(variant.current),
      local: withCell(variant.local),
    });
    assert.equal(
      result.conflicts.some((item) => item.kind === "itemTypeChanged"),
      true,
    );
  }

  const form = {
    id: "form",
    kind: "form" as const,
    to: "mail@example.test",
    submitButton: {
      label: "Send",
      variant: "default" as const,
      icon: null,
      iconPosition: "before" as const,
    },
    successMessage: null,
    errorMessage: null,
  };
  const fieldBase = {
    id: "field",
    name: "field",
    label: "Field",
    placeholder: null,
    required: false,
  };
  const withField = (
    field:
      | (typeof fieldBase & { type: "text" })
      | (typeof fieldBase & { type: "email" })
      | (typeof fieldBase & { type: "select"; options: [] }),
  ): SectionBlock => ({
    ...baseline,
    rows: [{
      ...row,
      columns: [
        row.columns[0],
        { ...secondColumn, cells: [{ ...form, fields: [field] }] },
      ],
    }],
  });
  const formResult = mergeSectionBlock({
    baseline: withField({ ...fieldBase, type: "text" }),
    current: withField({ ...fieldBase, type: "email" }),
    local: withField({ ...fieldBase, type: "select", options: [] }),
  });
  assert.equal(
    formResult.conflicts.some((item) => item.kind === "itemTypeChanged"),
    true,
  );
});

void test("order merge preserves remote additions and rejects cycles", () => {
  const compatible = resolveThreeWayOrder({
    baselineOrder: ["a", "b", "c"],
    localOrder: ["b", "a", "c"],
    currentOrder: ["a", "b", "c", "remote"],
    path: "blocks",
  });
  assert.equal(compatible.status, "resolved");
  if (compatible.status === "resolved") {
    assert.equal(new Set(compatible.order).has("remote"), true);
    assert.equal(compatible.order.indexOf("b") < compatible.order.indexOf("a"), true);
  }

  const incompatible = resolveThreeWayOrder({
    baselineOrder: ["a", "b", "c"],
    localOrder: ["b", "a", "c"],
    currentOrder: ["a", "c", "b"],
    path: "blocks",
  });
  assert.equal(incompatible.status, "conflict");
});

void test("relative insertion never removes IDs and rejects baseline IDs inside its interval", () => {
  const baselineInsideInterval = createPlacementOrder({
    baselineOrder: ["a", "b", "c"],
    currentOrder: ["a", "c", "b"],
    blockId: "local",
    placement: { kind: "after", blockId: "a" },
  });
  assert.equal(baselineInsideInterval.status, "orderIncompatible");

  const resolved = createPlacementOrder({
    baselineOrder: ["a", "b", "c"],
    currentOrder: ["a", "remote", "b", "c"],
    blockId: "local",
    placement: { kind: "after", blockId: "a" },
  });
  assert.equal(resolved.status, "resolved");
  if (resolved.status === "resolved") {
    assert.deepEqual(resolved.order, ["a", "local", "remote", "b", "c"]);
    assert.equal(resolved.order.length, 5);
    assert.deepEqual(
      new Set(resolved.order),
      new Set(["a", "b", "c", "remote", "local"]),
    );
  }
});

void test("start, end, before, after, moved and removed anchors obey stable intervals", () => {
  const resolvedOrders = [
    createPlacementOrder({
      baselineOrder: ["a", "b"],
      currentOrder: ["remote", "a", "b"],
      blockId: "local",
      placement: { kind: "start" },
    }),
    createPlacementOrder({
      baselineOrder: ["a", "b"],
      currentOrder: ["a", "b", "remote"],
      blockId: "local",
      placement: { kind: "end" },
    }),
    createPlacementOrder({
      baselineOrder: ["a", "b"],
      currentOrder: ["a", "b"],
      blockId: "local",
      placement: { kind: "before", blockId: "b" },
    }),
    createPlacementOrder({
      baselineOrder: ["a", "b"],
      currentOrder: ["a", "b"],
      blockId: "local",
      placement: { kind: "after", blockId: "a" },
    }),
  ];
  assert.deepEqual(
    resolvedOrders.map((result) =>
      result.status === "resolved" ? result.order : null),
    [
      ["local", "remote", "a", "b"],
      ["a", "b", "remote", "local"],
      ["a", "local", "b"],
      ["a", "local", "b"],
    ],
  );
  const moved = createPlacementOrder({
    baselineOrder: ["a", "b", "c"],
    currentOrder: ["b", "a", "c"],
    blockId: "local",
    placement: { kind: "after", blockId: "a" },
  });
  assert.equal(moved.status, "orderIncompatible");
  const removed = createPlacementOrder({
    baselineOrder: ["a", "b"],
    currentOrder: ["b"],
    blockId: "local",
    placement: { kind: "after", blockId: "a" },
  });
  assert.deepEqual(removed, { status: "anchorMissing", id: "a" });
});

void test("end appends after the current order even when the baseline tail changed", () => {
  const removedBaselineTail = createPlacementOrder({
    baselineOrder: ["a", "b"],
    currentOrder: ["a"],
    blockId: "local",
    placement: { kind: "end" },
  });
  const concurrentAddition = createPlacementOrder({
    baselineOrder: ["a", "b"],
    currentOrder: ["a", "b", "remote"],
    blockId: "local",
    placement: { kind: "end" },
  });

  assert.deepEqual(removedBaselineTail, {
    status: "resolved",
    order: ["a", "local"],
  });
  assert.deepEqual(concurrentAddition, {
    status: "resolved",
    order: ["a", "b", "remote", "local"],
  });
  if (concurrentAddition.status === "resolved") {
    assert.equal(concurrentAddition.order.length, 4);
    assert.deepEqual(
      new Set(concurrentAddition.order),
      new Set(["a", "b", "remote", "local"]),
    );
  }
});

void test("relative placements retain anchorMissing when their anchor was removed", () => {
  for (const placement of [
    { kind: "before", blockId: "gone" },
    { kind: "after", blockId: "gone" },
  ] as const) {
    assert.deepEqual(createPlacementOrder({
      baselineOrder: ["a", "gone"],
      currentOrder: ["a"],
      blockId: "local",
      placement,
    }), { status: "anchorMissing", id: "gone" });
  }
});

void test("concurrent interval order must remain canonical and local batches preserve local order", () => {
  const nonCanonical = createPlacementOrder({
    baselineOrder: ["a", "b"],
    currentOrder: ["a", "z", "remote", "b"],
    blockId: "local",
    placement: { kind: "after", blockId: "a" },
  });
  assert.equal(nonCanonical.status, "orderIncompatible");
  assert.deepEqual(
    insertManyInStableInterval({
      baselineOrder: ["a", "b"],
      currentOrder: ["a", "b"],
      blockIds: ["local-z", "local-a"],
      left: "a",
      right: "b",
    }),
    ["a", "local-z", "local-a", "b"],
  );
  assert.equal(
    insertManyInStableInterval({
      baselineOrder: ["a", "b"],
      currentOrder: ["a", "remote", "b"],
      blockIds: ["local-z", "local-a"],
      left: "a",
      right: "b",
    }),
    null,
  );
});

void test("nested additions preserve local order and conflict without dropping current IDs", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const column = row.columns[0];
  const steps = {
    id: "steps",
    kind: "steps" as const,
    variant: "vertical" as const,
    items: [
      { id: "one", title: "One", description: "One" },
      { id: "two", title: "Two", description: "Two" },
      { id: "three", title: "Three", description: "Three" },
    ],
  };
  const withItems = (items: typeof steps.items): SectionBlock => ({
    ...baseline,
    rows: [{
      ...row,
      columns: [
        { ...column, cells: [{ ...steps, items }] },
        row.columns[1],
      ],
    }],
  });

  const localItems = [
    steps.items[0],
    { id: "local-z", title: "Z", description: "Z" },
    { id: "local-a", title: "A", description: "A" },
    steps.items[1],
    steps.items[2],
  ];
  const localOnly = mergeSectionBlock({
    baseline: withItems(steps.items),
    current: withItems(steps.items),
    local: withItems(localItems),
  });
  assert.deepEqual(localOnly.conflicts, []);
  const localCell = localOnly.candidate.rows[0]?.columns[0]?.cells[0];
  assert.equal(localCell?.kind, "steps");
  if (localCell?.kind === "steps") {
    assert.deepEqual(
      localCell.items.map((item) => item.id),
      ["one", "local-z", "local-a", "two", "three"],
    );
  }

  const incompatibleCurrentOrder = [
    steps.items[1],
    steps.items[0],
    steps.items[2],
  ];
  const incompatibleLocalOrder = [
    steps.items[0],
    steps.items[2],
    steps.items[1],
  ];
  const orderOnly = mergeSectionBlock({
    baseline: withItems(steps.items),
    current: withItems(incompatibleCurrentOrder),
    local: withItems(incompatibleLocalOrder),
  });
  assert.deepEqual(
    orderOnly.conflicts.map((conflict) => conflict.kind),
    ["orderIncompatible"],
  );

  const orderWithLocalAddition = mergeSectionBlock({
    baseline: withItems(steps.items),
    current: withItems(incompatibleCurrentOrder),
    local: withItems([
      steps.items[0],
      { id: "local-order-addition", title: "Local", description: "Local" },
      steps.items[2],
      steps.items[1],
    ]),
  });
  assert.deepEqual(
    orderWithLocalAddition.conflicts.map((conflict) => conflict.kind),
    ["orderIncompatible", "collectionIncompatible"],
  );

  const remoteItems = [
    steps.items[0],
    { id: "remote", title: "Remote", description: "Remote" },
    steps.items[1],
    steps.items[2],
  ];
  const competing = mergeSectionBlock({
    baseline: withItems(steps.items),
    current: withItems(remoteItems),
    local: withItems(localItems),
  });
  assert.equal(
    competing.conflicts.some(
      (conflict) => conflict.kind === "collectionIncompatible",
    ),
    true,
  );
  const competingCell = competing.candidate.rows[0]?.columns[0]?.cells[0];
  assert.equal(competingCell?.kind, "steps");
  if (competingCell?.kind === "steps") {
    assert.equal(competingCell.items.some((item) => item.id === "remote"), true);
  }

  const reordered = mergeSectionBlock({
    baseline: withItems(steps.items),
    current: withItems([steps.items[0], steps.items[2], steps.items[1]]),
    local: withItems([
      steps.items[0],
      { id: "local", title: "Local", description: "Local" },
      steps.items[1],
      steps.items[2],
    ]),
  });
  assert.equal(
    reordered.conflicts.some(
      (conflict) => conflict.kind === "collectionIncompatible",
    ),
    true,
  );
  const reorderedCell = reordered.candidate.rows[0]?.columns[0]?.cells[0];
  assert.equal(reorderedCell?.kind, "steps");
  if (reorderedCell?.kind === "steps") {
    assert.deepEqual(
      new Set(reorderedCell.items.map((item) => item.id)),
      new Set(["one", "two", "three"]),
    );
  }
});

void test("carousel variant keeps its discriminant and items coherent", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const column = row.columns[0];
  const imageItem = {
    id: "item",
    src: "/image.jpg",
    alt: "Base",
    width: 100,
    height: 100,
    mediaAssetId: "asset",
    caption: null,
    href: null,
  };
  const common = {
    id: "carousel",
    kind: "carousel" as const,
    variant: "carousel" as const,
    showDots: true,
    showArrows: true,
  };
  const withCell = (
    cell: SectionBlock["rows"][number]["columns"][number]["cells"][number],
  ): SectionBlock => ({
    ...baseline,
    rows: [{
      ...row,
      columns: [{ ...column, cells: [cell] }, row.columns[1]],
    }],
  });
  const baseCell = {
    ...common,
    itemKind: "image" as const,
    items: [imageItem],
  };
  const currentCell = {
    ...common,
    itemKind: "card" as const,
    items: [{
      id: "item",
      eyebrow: null,
      title: "Card",
      description: "Card",
      icon: null,
      button: null,
    }],
  };
  const localCell = {
    ...baseCell,
    items: [{ ...imageItem, alt: "Local" }],
  };
  const result = mergeSectionBlock({
    baseline: withCell(baseCell),
    current: withCell(currentCell),
    local: withCell(localCell),
  });
  assert.equal(
    result.conflicts.some(
      (conflict) =>
        conflict.kind === "itemTypeChanged" &&
        conflict.path.endsWith(".itemKind"),
    ),
    true,
  );
  const candidate = result.candidate.rows[0]?.columns[0]?.cells[0];
  assert.equal(candidate?.kind, "carousel");
  if (candidate?.kind === "carousel") {
    assert.equal(candidate.itemKind, "image");
    assert.equal("alt" in candidate.items[0], true);
  }
});

void test("row and spacer breakpoints merge independently while submitButton remains atomic", () => {
  const baseline = block();
  const row = baseline.rows[0];
  const current = {
    ...baseline,
    rows: [{
      ...row,
      reverseOn: { ...row.reverseOn, mobile: true },
    }],
  };
  const local = {
    ...baseline,
    rows: [{
      ...row,
      reverseOn: { ...row.reverseOn, desktop: true },
    }],
  };
  const rowResult = mergeSectionBlock({ baseline, current, local });
  assert.deepEqual(rowResult.conflicts, []);
  assert.deepEqual(rowResult.candidate.rows[0]?.reverseOn, {
    mobile: true,
    tablet: false,
    desktop: true,
  });

  const firstColumn = row.columns[0];
  const withCell = (
    cell: SectionBlock["rows"][number]["columns"][number]["cells"][number],
  ): SectionBlock => ({
    ...baseline,
    rows: [{
      ...row,
      columns: [{ ...firstColumn, cells: [cell] }, row.columns[1]],
    }],
  });
  const spacer = {
    id: "spacer",
    kind: "spacer" as const,
    size: "md" as const,
    visibility: { mobile: true, tablet: true, desktop: true },
  };
  const spacerResult = mergeSectionBlock({
    baseline: withCell(spacer),
    current: withCell({
      ...spacer,
      visibility: { ...spacer.visibility, mobile: false },
    }),
    local: withCell({
      ...spacer,
      visibility: { ...spacer.visibility, desktop: false },
    }),
  });
  assert.deepEqual(spacerResult.conflicts, []);
  const spacerCandidate =
    spacerResult.candidate.rows[0]?.columns[0]?.cells[0];
  assert.equal(spacerCandidate?.kind, "spacer");
  if (spacerCandidate?.kind === "spacer") {
    assert.deepEqual(spacerCandidate.visibility, {
      mobile: false,
      tablet: true,
      desktop: false,
    });
  }

  const form = {
    id: "form",
    kind: "form" as const,
    to: "mail@example.test",
    submitButton: {
      label: "Send",
      variant: "default" as const,
      icon: null,
      iconPosition: "before" as const,
    },
    successMessage: null,
    errorMessage: null,
    fields: [],
  };
  const submitResult = mergeSectionBlock({
    baseline: withCell(form),
    current: withCell({
      ...form,
      submitButton: { ...form.submitButton, label: "Remote" },
    }),
    local: withCell({
      ...form,
      submitButton: {
        ...form.submitButton,
        variant: "secondary" as const,
      },
    }),
  });
  assert.equal(
    submitResult.conflicts.some(
      (conflict) =>
        conflict.kind === "fieldConflict" &&
        conflict.path.endsWith(".submitButton"),
    ),
    true,
  );
});
