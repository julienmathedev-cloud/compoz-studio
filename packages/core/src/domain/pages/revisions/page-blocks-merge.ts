/**
 * @file packages/core/src/domain/pages/revisions/page-blocks-merge.ts
 * @layer core/domain/pages/revisions
 * @description Typed three-way merge for section rows, columns, cells, and identified cell collections.
 * @remarks Atomic editorial values are never diffed internally. Discriminated variants are resolved before their associated content.
 */

import type {
  BlockColumn,
  BlockRow,
  SectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import type {
  ButtonItem,
  CardCollectionItem,
  CarouselItem,
  Cell,
  FormField,
  ImageEditor,
  StepItem,
  StructuredCardSection,
  TestimonialItem,
  TimelineItem,
} from "@compoz/core/domain/pages/entities/cell";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { pageBlockValueEquals } from "@compoz/core/domain/pages/revisions/page-blocks-equality";
import {
  insertInStableInterval,
  insertManyInStableInterval,
  placementAnchors,
  resolveThreeWayOrder,
} from "@compoz/core/domain/pages/revisions/page-blocks-order";
import type {
  BlockConflict,
  BlockFieldConflict,
  BlockFieldConflictLocation,
  BlockFieldLocationSegment,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";

type MergeContext = {
  conflicts: BlockConflict[];
};

type Identified = Readonly<{ id: string }>;

function unsupportedConflictPath(path: string): never {
  throw new DomainError({
    code: ERROR_CODES.INVALID_ARGUMENT,
    details: { path: ["fieldConflict", path] },
  });
}

function fieldLocation(path: string): BlockFieldConflictLocation {
  const block = path.match(/^blocks\[([^\]]+)\](.*)$/);
  if (!block) {
    return unsupportedConflictPath(path);
  }

  const blockId = block[1];
  const tokens = [...block[2].matchAll(/\.([A-Za-z][A-Za-z0-9]*)|\[([^\]]+)\]/g)];
  const segments: BlockFieldLocationSegment[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const property = tokens[index]?.[1];
    if (!property) continue;
    const identifiedId = tokens[index + 1]?.[2];

    if (identifiedId) {
      const identifiedKind =
        property === "rows"
          ? "row"
          : property === "columns"
            ? "column"
            : property === "cells"
              ? "cell"
              : property === "fields"
                ? "formField"
                : property === "sections"
                  ? "structuredCardSection"
                  : property === "items"
                    ? "identifiedItem"
                    : null;
      if (!identifiedKind) {
        return unsupportedConflictPath(path);
      }
      segments.push({ kind: identifiedKind, id: identifiedId });
      index++;
      continue;
    }

    segments.push(
      property === "image" && index < tokens.length - 1
        ? { kind: "image" }
        : { kind: "field", name: property },
    );
  }

  if (
    segments.length === 0 ||
    segments.at(-1)?.kind !== "field"
  ) {
    return unsupportedConflictPath(path);
  }

  return { kind: "blockField", blockId, segments };
}

function fieldConflict(
  context: MergeContext,
  path: string,
  baseline: unknown,
  current: unknown,
  local: unknown,
): void {
  const conflict: BlockFieldConflict = {
    kind: "fieldConflict",
    path,
    location: fieldLocation(path),
    baseline,
    current,
    local,
  };
  context.conflicts.push(conflict);
}

function mergeValue<T>(
  context: MergeContext,
  path: string,
  baseline: T,
  current: T,
  local: T,
): T {
  if (pageBlockValueEquals(local, baseline)) return current;
  if (pageBlockValueEquals(current, baseline)) return local;
  if (pageBlockValueEquals(current, local)) return current;
  fieldConflict(context, path, baseline, current, local);
  return local;
}

function mergeRecordFields<T extends object>(
  context: MergeContext,
  path: string,
  baseline: T,
  current: T,
  local: T,
  fields: ReadonlyArray<keyof T>,
): T {
  const candidate = { ...current };
  for (const field of fields) {
    candidate[field] = mergeValue(
      context,
      `${path}.${String(field)}`,
      baseline[field],
      current[field],
      local[field],
    );
  }
  return candidate;
}

function mergeOptional<T>(
  context: MergeContext,
  path: string,
  baseline: T | null,
  current: T | null,
  local: T | null,
  mergePresent: (baseline: T, current: T, local: T) => T,
): T | null {
  const baselinePresent = baseline !== null;
  const currentPresent = current !== null;
  const localPresent = local !== null;

  if (
    baselinePresent &&
    currentPresent &&
    localPresent
  ) {
    return mergePresent(baseline, current, local);
  }
  return mergeValue(context, path, baseline, current, local);
}

function mergeImageEditor(
  context: MergeContext,
  path: string,
  baseline: ImageEditor,
  current: ImageEditor,
  local: ImageEditor,
): ImageEditor {
  const mediaBaseline = {
    src: baseline.src,
    width: baseline.width,
    height: baseline.height,
    mediaAssetId: baseline.mediaAssetId,
  };
  const mediaCurrent = {
    src: current.src,
    width: current.width,
    height: current.height,
    mediaAssetId: current.mediaAssetId,
  };
  const mediaLocal = {
    src: local.src,
    width: local.width,
    height: local.height,
    mediaAssetId: local.mediaAssetId,
  };
  const media = mergeValue(
    context,
    `${path}.media`,
    mediaBaseline,
    mediaCurrent,
    mediaLocal,
  );

  return {
    ...current,
    ...media,
    alt: mergeValue(context, `${path}.alt`, baseline.alt, current.alt, local.alt),
    caption: mergeValue(
      context,
      `${path}.caption`,
      baseline.caption,
      current.caption,
      local.caption,
    ),
    href: mergeValue(
      context,
      `${path}.href`,
      baseline.href,
      current.href,
      local.href,
    ),
  };
}

function mergeSimpleItem<T extends Identified>(
  fields: ReadonlyArray<keyof T>,
) {
  return (
    context: MergeContext,
    path: string,
    baseline: T,
    current: T,
    local: T,
  ): T => mergeRecordFields(context, path, baseline, current, local, fields);
}

function mergeButton(
  context: MergeContext,
  path: string,
  baseline: ButtonItem,
  current: ButtonItem,
  local: ButtonItem,
): ButtonItem {
  return mergeRecordFields(context, path, baseline, current, local, [
    "label",
    "variant",
    "icon",
    "iconPosition",
    "href",
  ]);
}

function mergeStructuredSection(
  context: MergeContext,
  path: string,
  baseline: StructuredCardSection,
  current: StructuredCardSection,
  local: StructuredCardSection,
): StructuredCardSection {
  return mergeRecordFields(context, path, baseline, current, local, [
    "label",
    "content",
  ]);
}

type MergeElement<T extends Identified> = (
  context: MergeContext,
  path: string,
  baseline: T,
  current: T,
  local: T,
) => T;

function mergeIdentifiedCollection<T extends Identified>(input: Readonly<{
  context: MergeContext;
  path: string;
  baseline: ReadonlyArray<T>;
  current: ReadonlyArray<T>;
  local: ReadonlyArray<T>;
  mergeElement: MergeElement<T>;
}>): ReadonlyArray<T> {
  const { context, path, baseline, current, local, mergeElement } = input;
  const baselineById = new Map(baseline.map((item) => [item.id, item]));
  const currentById = new Map(current.map((item) => [item.id, item]));
  const localById = new Map(local.map((item) => [item.id, item]));
  const mergedById = new Map<string, T>();

  for (const baselineItem of baseline) {
    const currentItem = currentById.get(baselineItem.id);
    const localItem = localById.get(baselineItem.id);
    const itemPath = `${path}[${baselineItem.id}]`;

    if (!currentItem && !localItem) continue;
    if (!localItem && currentItem) {
      if (pageBlockValueEquals(currentItem, baselineItem)) continue;
      context.conflicts.push({
        kind: "collectionIncompatible",
        path: itemPath,
        baseline: baselineItem,
        current: currentItem,
        local: null,
      });
      continue;
    }
    if (localItem && !currentItem) {
      if (pageBlockValueEquals(localItem, baselineItem)) continue;
      context.conflicts.push({
        kind: "collectionIncompatible",
        path: itemPath,
        baseline: baselineItem,
        current: null,
        local: localItem,
      });
      mergedById.set(localItem.id, localItem);
      continue;
    }
    if (localItem && currentItem) {
      mergedById.set(
        baselineItem.id,
        mergeElement(
          context,
          itemPath,
          baselineItem,
          currentItem,
          localItem,
        ),
      );
    }
  }

  for (const currentItem of current) {
    if (!baselineById.has(currentItem.id)) {
      const localItem = localById.get(currentItem.id);
      if (localItem) {
        context.conflicts.push({
          kind: "idReused",
          path: `${path}[${currentItem.id}]`,
          id: currentItem.id,
        });
        mergedById.set(currentItem.id, localItem);
      } else {
        mergedById.set(currentItem.id, currentItem);
      }
    }
  }

  for (const localItem of local) {
    if (!baselineById.has(localItem.id) && !currentById.has(localItem.id)) {
      mergedById.set(localItem.id, localItem);
    }
  }

  const baselineExisting = baseline
    .map((item) => item.id)
    .filter((id) => mergedById.has(id));
  const localBaselineOrder = local
    .map((item) => item.id)
    .filter((id) => baselineById.has(id) && mergedById.has(id));
  const currentExisting = current
    .map((item) => item.id)
    .filter((id) => mergedById.has(id));
  const orderResolution = resolveThreeWayOrder({
    baselineOrder: baselineExisting,
    localOrder: localBaselineOrder,
    currentOrder: currentExisting,
    path,
  });

  let order =
    orderResolution.status === "resolved"
      ? [...orderResolution.order]
      : [...currentExisting];

  if (orderResolution.status === "conflict") {
    context.conflicts.push(orderResolution.conflict);
    const hasLocalOnlyAddition = local.some(
      (item) => !baselineById.has(item.id) && !currentById.has(item.id),
    );
    if (hasLocalOnlyAddition) {
      context.conflicts.push({
        kind: "collectionIncompatible",
        path,
        baseline,
        current,
        local,
      });
    }
  }

  if (orderResolution.status === "resolved") {
    const localOrder = local.map((item) => item.id);
    const additionsByInterval = new Map<
      string,
      {
        left: string | null;
        right: string | null;
        ids: string[];
      }
    >();

    for (const localItem of local) {
      if (baselineById.has(localItem.id) || currentById.has(localItem.id)) {
        continue;
      }
      const localIndex = localOrder.indexOf(localItem.id);
      const left =
        [...localOrder.slice(0, localIndex)]
          .reverse()
          .find((id) => baselineById.has(id)) ?? null;
      const right =
        localOrder
          .slice(localIndex + 1)
          .find((id) => baselineById.has(id)) ?? null;
      const key = `${left ?? ""}\u0000${right ?? ""}`;
      const interval = additionsByInterval.get(key) ?? {
        left,
        right,
        ids: [],
      };
      interval.ids.push(localItem.id);
      additionsByInterval.set(key, interval);
    }

    for (const interval of additionsByInterval.values()) {
      const inserted = insertManyInStableInterval({
        currentOrder: order,
        baselineOrder: baseline.map((item) => item.id),
        blockIds: interval.ids,
        left: interval.left,
        right: interval.right,
      });
      if (!inserted) {
        context.conflicts.push({
          kind: "collectionIncompatible",
          path,
          baseline,
          current,
          local,
        });
        continue;
      }
      order = [...inserted];
    }
  }

  return order
    .map((id) => mergedById.get(id))
    .filter((item): item is T => item !== undefined);
}

function mergeItemByKind(
  itemKind: "image" | "card" | "extendedCard" | "structuredCard",
): MergeElement<CarouselItem> {
  return (context, path, baseline, current, local) => {
    if (itemKind === "image") {
      return mergeImageEditor(
        context,
        path,
        baseline as ImageEditor,
        current as ImageEditor,
        local as ImageEditor,
      );
    }

    if (itemKind === "structuredCard") {
      const baselineCard = baseline as Extract<CarouselItem, { sections: unknown }>;
      const currentCard = current as typeof baselineCard;
      const localCard = local as typeof baselineCard;
      const candidate = mergeRecordFields(
        context,
        path,
        baselineCard,
        currentCard,
        localCard,
        ["title", "meta"],
      );
      return {
        ...candidate,
        image: mergeOptional(
          context,
          `${path}.image`,
          baselineCard.image,
          currentCard.image,
          localCard.image,
          (base, remote, own) =>
            mergeImageEditor(context, `${path}.image`, base, remote, own),
        ),
        button: mergeOptional(
          context,
          `${path}.button`,
          baselineCard.button,
          currentCard.button,
          localCard.button,
          (base, remote, own) =>
            mergeButton(context, `${path}.button`, base, remote, own),
        ),
        sections: mergeIdentifiedCollection({
          context,
          path: `${path}.sections`,
          baseline: baselineCard.sections,
          current: currentCard.sections,
          local: localCard.sections,
          mergeElement: mergeStructuredSection,
        }),
      };
    }

    if (itemKind === "card") {
      const baselineCard = baseline as Extract<CarouselItem, { eyebrow: unknown; bullets?: never }>;
      const currentCard = current as typeof baselineCard;
      const localCard = local as typeof baselineCard;
      const candidate = mergeRecordFields(
        context,
        path,
        baselineCard,
        currentCard,
        localCard,
        ["eyebrow", "title", "description", "icon"],
      );
      return {
        ...candidate,
        button: mergeOptional(
          context,
          `${path}.button`,
          baselineCard.button,
          currentCard.button,
          localCard.button,
          (base, remote, own) =>
            mergeButton(context, `${path}.button`, base, remote, own),
        ),
      };
    }

    const baselineCard = baseline as Extract<CarouselItem, { bullets: unknown }>;
    const currentCard = current as typeof baselineCard;
    const localCard = local as typeof baselineCard;
    const candidate = mergeRecordFields(
      context,
      path,
      baselineCard,
      currentCard,
      localCard,
      ["eyebrow", "title", "description", "bullets", "footer", "icon"],
    );
    return {
      ...candidate,
      button: mergeOptional(
        context,
        `${path}.button`,
        baselineCard.button,
        currentCard.button,
        localCard.button,
        (base, remote, own) =>
          mergeButton(context, `${path}.button`, base, remote, own),
      ),
    };
  };
}

function mergeDiscriminatedCollection<T extends Identified>(input: Readonly<{
  context: MergeContext;
  path: string;
  kindField: "itemKind" | "cardKind";
  baselineKind: string;
  currentKind: string;
  localKind: string;
  baseline: ReadonlyArray<T>;
  current: ReadonlyArray<T>;
  local: ReadonlyArray<T>;
  mergeElement: (kind: string) => MergeElement<T>;
}>): Readonly<{ kind: string; items: ReadonlyArray<T> }> {
  if (
    input.baselineKind === input.currentKind &&
    input.baselineKind === input.localKind
  ) {
    return {
      kind: input.baselineKind,
      items: mergeIdentifiedCollection({
        context: input.context,
        path: `${input.path}.items`,
        baseline: input.baseline,
        current: input.current,
        local: input.local,
        mergeElement: input.mergeElement(input.baselineKind),
      }),
    };
  }

  const baselineVariant = {
    kind: input.baselineKind,
    items: input.baseline,
  };
  const currentVariant = {
    kind: input.currentKind,
    items: input.current,
  };
  const localVariant = {
    kind: input.localKind,
    items: input.local,
  };

  if (pageBlockValueEquals(currentVariant, baselineVariant)) {
    return localVariant;
  }
  if (pageBlockValueEquals(localVariant, baselineVariant)) {
    return currentVariant;
  }
  if (pageBlockValueEquals(currentVariant, localVariant)) {
    return currentVariant;
  }

  input.context.conflicts.push({
    kind: "itemTypeChanged",
    path: `${input.path}.${input.kindField}`,
    baseline: input.baselineKind,
    current: input.currentKind,
    local: input.localKind,
  });
  return localVariant;
}

function mergeFormField(
  context: MergeContext,
  path: string,
  baseline: FormField,
  current: FormField,
  local: FormField,
): FormField {
  if (
    baseline.type === current.type &&
    baseline.type === local.type &&
    baseline.type === "select" &&
    current.type === "select" &&
    local.type === "select"
  ) {
    return mergeRecordFields(context, path, baseline, current, local, [
      "name",
      "label",
      "placeholder",
      "required",
      "options",
    ]);
  }
  if (
    baseline.type === current.type &&
    baseline.type === local.type
  ) {
    return mergeRecordFields(context, path, baseline, current, local, [
      "name",
      "label",
      "placeholder",
      "required",
    ]);
  }

  if (pageBlockValueEquals(current, baseline)) return local;
  if (pageBlockValueEquals(local, baseline)) return current;
  if (pageBlockValueEquals(current, local)) return current;

  context.conflicts.push({
    kind: "itemTypeChanged",
    path: `${path}.type`,
    baseline: baseline.type,
    current: current.type,
    local: local.type,
  });
  return local;
}

function mergeCell(
  context: MergeContext,
  path: string,
  baseline: Cell,
  current: Cell,
  local: Cell,
): Cell {
  if (baseline.kind !== current.kind || baseline.kind !== local.kind) {
    if (
      pageBlockValueEquals(current, baseline) ||
      pageBlockValueEquals(local, baseline) ||
      pageBlockValueEquals(current, local)
    ) {
      return mergeValue(context, path, baseline, current, local);
    }
    context.conflicts.push({
      kind: "cellTypeChanged",
      path,
      baseline,
      current,
      local,
    });
    return local;
  }

  switch (baseline.kind) {
    case "heading":
      return mergeRecordFields(
        context,
        path,
        baseline,
        current as typeof baseline,
        local as typeof baseline,
        [
          "cssClassName",
          "level",
          "title",
          "subtitle",
          "align",
          "variant",
          "separator",
          "idAnchor",
          "reveal",
          "highlights",
        ],
      );
    case "richText":
      return mergeRecordFields(context, path, baseline, current as typeof baseline, local as typeof baseline, [
        "cssClassName",
        "content",
        "reveal",
      ]);
    case "spacer":
      return {
        ...mergeRecordFields(
          context,
          path,
          baseline,
          current as typeof baseline,
          local as typeof baseline,
          ["cssClassName", "size"],
        ),
        visibility: mergeRecordFields(
          context,
          `${path}.visibility`,
          baseline.visibility,
          (current as typeof baseline).visibility,
          (local as typeof baseline).visibility,
          ["mobile", "tablet", "desktop"],
        ),
      };
    case "separator":
      return mergeRecordFields(context, path, baseline, current as typeof baseline, local as typeof baseline, [
        "cssClassName",
        "align",
        "size",
      ]);
    case "buttons": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "align",
          "gap",
        ]),
        items: mergeIdentifiedCollection({
          context,
          path: `${path}.items`,
          baseline: baseline.items,
          current: remote.items,
          local: own.items,
          mergeElement: mergeButton,
        }),
      };
    }
    case "image": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "variant",
          "size",
          "reveal",
          "zoomEnabled",
        ]),
        image: mergeImageEditor(
          context,
          `${path}.image`,
          baseline.image,
          remote.image,
          own.image,
        ),
      };
    }
    case "gallery": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "linksEnabled",
          "maxColumns",
          "reveal",
        ]),
        items: mergeIdentifiedCollection({
          context,
          path: `${path}.items`,
          baseline: baseline.items,
          current: remote.items,
          local: own.items,
          mergeElement: mergeImageEditor,
        }),
      };
    }
    case "carousel": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      const collection = mergeDiscriminatedCollection({
        context,
        path,
        kindField: "itemKind",
        baselineKind: baseline.itemKind,
        currentKind: remote.itemKind,
        localKind: own.itemKind,
        baseline: baseline.items,
        current: remote.items,
        local: own.items,
        mergeElement: (kind) =>
          mergeItemByKind(kind as typeof baseline.itemKind),
      });
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "variant",
          "showDots",
          "showArrows",
        ]),
        itemKind: collection.kind as typeof baseline.itemKind,
        items: collection.items,
      };
    }
    case "cardCollection": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      const collection = mergeDiscriminatedCollection<CardCollectionItem>({
        context,
        path,
        kindField: "cardKind",
        baselineKind: baseline.cardKind,
        currentKind: remote.cardKind,
        localKind: own.cardKind,
        baseline: baseline.items,
        current: remote.items,
        local: own.items,
        mergeElement: (kind) =>
          mergeItemByKind(kind as "card" | "extendedCard" | "structuredCard") as MergeElement<CardCollectionItem>,
      });
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "columns",
          "align",
          "reveal",
        ]),
        cardKind: collection.kind as typeof baseline.cardKind,
        items: collection.items,
      };
    }
    case "steps": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "variant",
        ]),
        items: mergeIdentifiedCollection<StepItem>({
          context,
          path: `${path}.items`,
          baseline: baseline.items,
          current: remote.items,
          local: own.items,
          mergeElement: mergeSimpleItem(["title", "description"]),
        }),
      };
    }
    case "testimonials": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "title",
          "description",
          "displayMode",
        ]),
        items: mergeIdentifiedCollection<TestimonialItem>({
          context,
          path: `${path}.items`,
          baseline: baseline.items,
          current: remote.items,
          local: own.items,
          mergeElement: mergeSimpleItem([
            "quote",
            "authorName",
            "authorRole",
            "authorImage",
            "rating",
          ]),
        }),
      };
    }
    case "form": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        // The submit button is intentionally atomic: its presentation fields
        // are edited as one Studio control and therefore conflict as one value.
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "to",
          "submitButton",
          "successMessage",
          "errorMessage",
        ]),
        fields: mergeIdentifiedCollection<FormField>({
          context,
          path: `${path}.fields`,
          baseline: baseline.fields,
          current: remote.fields,
          local: own.fields,
          mergeElement: mergeFormField,
        }),
      };
    }
    case "timeline": {
      const remote = current as typeof baseline;
      const own = local as typeof baseline;
      return {
        ...mergeRecordFields(context, path, baseline, remote, own, [
          "cssClassName",
          "collapsible",
        ]),
        items: mergeIdentifiedCollection<TimelineItem>({
          context,
          path: `${path}.items`,
          baseline: baseline.items,
          current: remote.items,
          local: own.items,
          mergeElement: mergeSimpleItem([
            "period",
            "title",
            "subtitle",
            "description",
            "badge",
            "keywords",
          ]),
        }),
      };
    }
  }
}

function mergeColumn(
  context: MergeContext,
  path: string,
  baseline: BlockColumn,
  current: BlockColumn,
  local: BlockColumn,
): BlockColumn {
  return {
    id: current.id,
    cells: mergeIdentifiedCollection({
      context,
      path: `${path}.cells`,
      baseline: baseline.cells,
      current: current.cells,
      local: local.cells,
      mergeElement: mergeCell,
    }),
  };
}

function mergeRow(
  context: MergeContext,
  path: string,
  baseline: BlockRow,
  current: BlockRow,
  local: BlockRow,
): BlockRow {
  const columns = mergeIdentifiedCollection({
    context,
    path: `${path}.columns`,
    baseline: baseline.columns,
    current: current.columns,
    local: local.columns,
    mergeElement: mergeColumn,
  });
  const columnsCount = mergeValue(
    context,
    `${path}.columnsCount`,
    baseline.columnsCount,
    current.columnsCount,
    local.columnsCount,
  );

  if (columns.length !== columnsCount) {
    context.conflicts.push({
      kind: "collectionIncompatible",
      path: `${path}.columns`,
      baseline: baseline.columns,
      current: current.columns,
      local: local.columns,
    });
  }

  return {
    id: current.id,
    columnsCount,
    reverseOn: mergeRecordFields(
      context,
      `${path}.reverseOn`,
      baseline.reverseOn,
      current.reverseOn,
      local.reverseOn,
      ["mobile", "tablet", "desktop"],
    ),
    columns,
  };
}

export function mergeSectionBlockRows(input: Readonly<{
  blockId: string;
  baseline: ReadonlyArray<BlockRow>;
  current: ReadonlyArray<BlockRow>;
  local: ReadonlyArray<BlockRow>;
}>): Readonly<{
  rows: ReadonlyArray<BlockRow>;
  conflicts: ReadonlyArray<BlockConflict>;
}> {
  const context: MergeContext = { conflicts: [] };
  const rows = mergeIdentifiedCollection({
    context,
    path: `blocks[${input.blockId}].rows`,
    baseline: input.baseline,
    current: input.current,
    local: input.local,
    mergeElement: mergeRow,
  });
  return { rows, conflicts: context.conflicts };
}

export function mergeSectionBlock(input: Readonly<{
  baseline: SectionBlock;
  current: SectionBlock;
  local: SectionBlock;
}>): Readonly<{
  candidate: SectionBlock;
  conflicts: ReadonlyArray<BlockConflict>;
}> {
  const context: MergeContext = { conflicts: [] };
  const path = `blocks[${input.current.id}]`;
  const rows = mergeSectionBlockRows({
    blockId: input.current.id,
    baseline: input.baseline.rows,
    current: input.current.rows,
    local: input.local.rows,
  });
  context.conflicts.push(...rows.conflicts);

  return {
    candidate: {
      ...input.current,
      name: mergeValue(
        context,
        `${path}.name`,
        input.baseline.name,
        input.current.name,
        input.local.name,
      ),
      containerMode: mergeValue(
        context,
        `${path}.containerMode`,
        input.baseline.containerMode,
        input.current.containerMode,
        input.local.containerMode,
      ),
      cssClassName: mergeValue(
        context,
        `${path}.cssClassName`,
        input.baseline.cssClassName,
        input.current.cssClassName,
        input.local.cssClassName,
      ),
      lcpPriority: mergeValue(
        context,
        `${path}.lcpPriority`,
        input.baseline.lcpPriority,
        input.current.lcpPriority,
        input.local.lcpPriority,
      ),
      rows: rows.rows,
    },
    conflicts: context.conflicts,
  };
}

export function createPlacementOrder(input: Readonly<{
  baselineOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  blockId: string;
  placement:
    | Readonly<{ kind: "start" }>
    | Readonly<{ kind: "end" }>
    | Readonly<{ kind: "before"; blockId: string }>
    | Readonly<{ kind: "after"; blockId: string }>;
}>):
  | Readonly<{ status: "resolved"; order: ReadonlyArray<string> }>
  | Readonly<{ status: "anchorMissing"; id: string }>
  | Readonly<{
      status: "orderIncompatible";
      conflict: Extract<BlockConflict, { kind: "orderIncompatible" }>;
    }> {
  if (
    input.placement.kind === "end" &&
    new Set(input.currentOrder).size === input.currentOrder.length &&
    !input.currentOrder.includes(input.blockId)
  ) {
    return {
      status: "resolved",
      order: [...input.currentOrder, input.blockId],
    };
  }

  const anchors = placementAnchors(input.baselineOrder, input.placement);
  const placementAnchorId =
    "blockId" in input.placement ? input.placement.blockId : "";
  if (
    !anchors ||
    (placementAnchorId.length > 0 &&
      !input.currentOrder.includes(placementAnchorId))
  ) {
    return { status: "anchorMissing", id: placementAnchorId };
  }
  const order = insertInStableInterval({ ...input, ...anchors });
  if (order) return { status: "resolved", order };

  const localOrder = [...input.baselineOrder];
  const placementIndex =
    input.placement.kind === "start"
      ? 0
      : input.placement.kind === "end"
        ? localOrder.length
        : localOrder.indexOf(input.placement.blockId) +
          (input.placement.kind === "after" ? 1 : 0);
  localOrder.splice(placementIndex, 0, input.blockId);
  const baselineSet = new Set(input.baselineOrder);
  const currentSet = new Set(input.currentOrder);

  return {
    status: "orderIncompatible",
    conflict: {
      kind: "orderIncompatible",
      path: "blocks",
      baselineOrder: input.baselineOrder,
      localOrder,
      currentOrder: input.currentOrder,
      addedBlockIds: input.currentOrder.filter((id) => !baselineSet.has(id)),
      removedBlockIds: input.baselineOrder.filter((id) => !currentSet.has(id)),
    },
  };
}
