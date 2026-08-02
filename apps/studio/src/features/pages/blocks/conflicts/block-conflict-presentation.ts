/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-conflict-presentation.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Typed, decision-ready presentation adapters for Page block conflicts.
 */

import type { Block, BlockColumn, BlockRow } from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type {
  BlockConflict,
  BlockFieldConflict,
  BlockFieldLocationSegment,
  PageBlocksConflictDetails,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";
import {
  toPlainTextRichText,
  type ConflictDisplayValue,
  type ConflictPresentationDetail,
  type ConflictPresentationGroup,
} from "@compoz/studio/features/conflicts/conflict-presentation";

type T = (key: string, values?: Record<string, string | number>) => string;
type Identified = Readonly<{ id: string }>;
type NamedRecord = Readonly<Record<string, unknown>>;

export type BlockConflictPresentationContext = Readonly<{
  baselineBlocks?: readonly Block[];
  currentBlocks: readonly Block[];
  localBlocks?: readonly Block[];
  candidateBlock?: Block;
}>;

function allBlocks(context: BlockConflictPresentationContext): readonly Block[] {
  return [
    ...context.currentBlocks,
    ...(context.localBlocks ?? []),
    ...(context.baselineBlocks ?? []),
    ...(context.candidateBlock ? [context.candidateBlock] : []),
  ];
}

function findBlock(id: unknown, context: BlockConflictPresentationContext): Block | undefined {
  return allBlocks(context).find((candidate) => candidate.id === id);
}

function blockLabel(id: unknown, context: BlockConflictPresentationContext, t: T): string {
  if (id === null || id === undefined || id === "") return t("blocks.none");
  const block = findBlock(id, context);
  return block
    ? t("blocks.named", { name: block.name || t("blocks.unnamed") })
    : t("blocks.missing");
}

function isRecord(value: unknown): value is NamedRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function semanticName(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const key of ["name", "title", "label", "placeholder", "alt", "authorName", "period", "href"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function describeRecord(value: NamedRecord, t: T): string {
  const name = semanticName(value);
  if (name) return name;
  const kind = value["kind"] ?? value["type"];
  if (typeof kind === "string") return t("types.named", { type: t(`types.${kind}`) });
  const width = value["width"];
  const height = value["height"];
  if (typeof width === "number" && typeof height === "number") {
    return t("dimensions", { width, height });
  }
  return t("configurationChanged");
}

function fieldNameFromLocation(location?: BlockFieldConflict["location"]): string | undefined {
  if (location?.kind !== "blockField") return undefined;
  const field = [...location.segments].reverse().find((segment) => segment.kind === "field");
  return field?.kind === "field" ? field.name : undefined;
}

function display(
  value: unknown,
  t: T,
  context: BlockConflictPresentationContext,
  location?: BlockFieldConflict["location"],
): ConflictDisplayValue {
  if (location?.kind === "globalLcpOwner") {
    return { kind: "text", text: blockLabel(value, context, t) };
  }
  if (value === null || value === undefined || value === "") return { kind: "empty", text: t("empty") };
  if (typeof value === "boolean") return { kind: "boolean", text: value ? t("boolean.true") : t("boolean.false") };
  if (typeof value === "number") return { kind: "text", text: new Intl.NumberFormat().format(value) };
  if (typeof value === "string") {
    const field = fieldNameFromLocation(location);
    if (field && ["containerMode", "align", "variant", "displayMode", "iconPosition", "size", "kind", "type", "itemKind", "cardKind", "level", "gap"].includes(field)) {
      return { kind: "text", text: t(`values.${field}.${value}`) };
    }
    return value.includes("<")
      ? { kind: "rich-text", text: toPlainTextRichText(value, t("empty")) }
      : { kind: "text", text: value };
  }
  if (Array.isArray(value)) {
    return {
      kind: "list",
      items: value.map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        return isRecord(item) ? describeRecord(item, t) : t("configurationChanged");
      }),
    };
  }
  return isRecord(value)
    ? { kind: "text", text: describeRecord(value, t) }
    : { kind: "text", text: t("configurationChanged") };
}

function fieldLabel(name: string, t: T): string {
  const known = new Set(["name", "title", "subtitle", "content", "description", "label", "href", "url", "src", "alt", "width", "height", "required", "placeholder", "options", "containerMode", "cssClassName", "lcpPriority", "columnsCount", "mobile", "tablet", "desktop", "level", "align", "variant", "separator", "idAnchor", "reveal", "highlights", "size", "gap", "icon", "iconPosition", "zoomEnabled", "maxColumns", "showDots", "showArrows", "columns", "displayMode", "quote", "authorName", "authorRole", "rating", "submitButton", "successMessage", "errorMessage", "collapsible", "period", "kind", "type", "itemKind", "cardKind"]);
  return known.has(name) ? t(`fields.${name}`) : t("fields.unknown");
}

function findRow(block: Block | undefined, id: string): readonly [BlockRow, number] | null {
  const index = block?.rows.findIndex((row) => row.id === id) ?? -1;
  return block && index >= 0 ? [block.rows[index]!, index] : null;
}

function findColumn(row: BlockRow | undefined, id: string): readonly [BlockColumn, number] | null {
  const index = row?.columns.findIndex((column) => column.id === id) ?? -1;
  return row && index >= 0 ? [row.columns[index]!, index] : null;
}

function findCell(column: BlockColumn | undefined, id: string): readonly [Cell, number] | null {
  const index = column?.cells.findIndex((cell) => cell.id === id) ?? -1;
  return column && index >= 0 ? [column.cells[index]!, index] : null;
}

function identifiedItems(cell: Cell | undefined): readonly Identified[] {
  if (!cell) return [];
  switch (cell.kind) {
    case "buttons":
    case "gallery":
    case "carousel":
    case "cardCollection":
    case "steps":
    case "testimonials":
    case "timeline":
      return cell.items;
    case "heading":
    case "richText":
    case "spacer":
    case "separator":
    case "image":
    case "form":
      return [];
  }
}

function findIdentified(items: readonly Identified[], id: string): readonly [Identified, number] | null {
  const index = items.findIndex((item) => item.id === id);
  return index >= 0 ? [items[index]!, index] : null;
}

function cellLabel(cell: Cell, t: T): string {
  const name = semanticName(cell);
  return name
    ? t("locations.cellNamed", { name })
    : t("locations.cellTyped", { type: t(`types.${cell.kind}`) });
}

function describeSegments(block: Block | undefined, segments: readonly BlockFieldLocationSegment[], t: T): readonly string[] {
  let row: BlockRow | undefined;
  let column: BlockColumn | undefined;
  let cell: Cell | undefined;
  let item: Identified | undefined;
  const labels: string[] = [];

  for (const segment of segments) {
    switch (segment.kind) {
      case "row": {
        const found = findRow(block, segment.id);
        row = found?.[0];
        column = undefined;
        cell = undefined;
        item = undefined;
        labels.push(found ? t("locations.row", { position: found[1] + 1 }) : t("locations.rowMissing"));
        break;
      }
      case "column": {
        const found = findColumn(row, segment.id);
        column = found?.[0];
        cell = undefined;
        item = undefined;
        labels.push(found ? t("locations.column", { position: found[1] + 1 }) : t("locations.columnMissing"));
        break;
      }
      case "cell": {
        const found = findCell(column, segment.id);
        cell = found?.[0];
        item = undefined;
        labels.push(found ? cellLabel(found[0], t) : t("locations.cellDeleted"));
        break;
      }
      case "identifiedItem": {
        const found = findIdentified(identifiedItems(cell), segment.id);
        item = found?.[0];
        const name = semanticName(item);
        labels.push(found ? (name ? t("locations.itemNamed", { name }) : t("locations.itemPosition", { position: found[1] + 1 })) : t("locations.itemMissing"));
        break;
      }
      case "formField": {
        const found = cell?.kind === "form" ? findIdentified(cell.fields, segment.id) : null;
        item = found?.[0];
        const name = semanticName(item);
        labels.push(found ? (name ? t("locations.formFieldNamed", { name }) : t("locations.formFieldPosition", { position: found[1] + 1 })) : t("locations.formFieldDeleted"));
        break;
      }
      case "structuredCardSection": {
        const itemValue: unknown = item;
        const sections = isRecord(itemValue) && Array.isArray(itemValue["sections"])
          ? itemValue["sections"].filter((value): value is Identified => isRecord(value) && typeof value["id"] === "string")
          : [];
        const found = findIdentified(sections, segment.id);
        item = found?.[0];
        const name = semanticName(item);
        labels.push(found ? (name ? t("locations.structuredSectionNamed", { name }) : t("locations.structuredSectionPosition", { position: found[1] + 1 })) : t("locations.structuredSectionMissing"));
        break;
      }
      case "image": {
        const itemValue: unknown = item;
        const image = cell?.kind === "image"
          ? cell.image
          : isRecord(itemValue) && isRecord(itemValue["image"])
            ? itemValue["image"]
            : undefined;
        const alt = image && typeof image["alt"] === "string" ? image["alt"].trim() : "";
        labels.push(image ? (alt ? t("locations.imageNamed", { name: alt }) : t("locations.image")) : t("locations.imageDeleted"));
        break;
      }
      case "field":
        labels.push(t("locations.field", { name: fieldLabel(segment.name, t) }));
        break;
      default:
        assertNever(segment);
    }
  }
  return labels;
}

export function describeBlockFieldLocation(conflict: BlockFieldConflict, context: BlockConflictPresentationContext, t: T): string {
  if (conflict.location.kind === "globalLcpOwner") return t("locations.lcpOwner");
  const location = conflict.location;
  const block = context.currentBlocks.find((candidate) => candidate.id === location.blockId);
  const prefix = block
    ? t("blocks.named", { name: block.name || t("blocks.unnamed") })
    : findBlock(location.blockId, context)
      ? t("blocks.deleted")
      : t("blocks.missing");
  return [prefix, ...describeSegments(block, location.segments, t)].join(" · ");
}

type ResourceKind = "block" | "row" | "column" | "cell" | "item" | "formField" | "structuredSection" | "image" | "unknown";

function resourceKindFromPath(path: string): ResourceKind {
  if (/\.sections\[[^\]]+\]/u.test(path)) return "structuredSection";
  if (/\.fields\[[^\]]+\]/u.test(path)) return "formField";
  if (/\.items\[[^\]]+\]/u.test(path)) return "item";
  if (/\.image(?:\.|$)/u.test(path)) return "image";
  if (/\.cells\[[^\]]+\]/u.test(path)) return "cell";
  if (/\.columns\[[^\]]+\]/u.test(path)) return "column";
  if (/\.rows\[[^\]]+\]/u.test(path)) return "row";
  if (/^blocks\[[^\]]+\]$/u.test(path)) return "block";
  return "unknown";
}

function structuralContext(path: string, context: BlockConflictPresentationContext, t: T): string | undefined {
  const blockId = /^blocks\[([^\]]+)\]/u.exec(path)?.[1];
  if (!blockId) return undefined;
  const block = findBlock(blockId, context);
  const segments: BlockFieldLocationSegment[] = [];
  const patterns: readonly Readonly<[RegExp, BlockFieldLocationSegment["kind"]]>[] = [
    [/\.rows\[([^\]]+)\]/u, "row"],
    [/\.columns\[([^\]]+)\]/u, "column"],
    [/\.cells\[([^\]]+)\]/u, "cell"],
    [/\.items\[([^\]]+)\]/u, "identifiedItem"],
    [/\.fields\[([^\]]+)\]/u, "formField"],
    [/\.sections\[([^\]]+)\]/u, "structuredCardSection"],
  ];
  for (const [pattern, kind] of patterns) {
    const identifier = pattern.exec(path)?.[1];
    if (!identifier) continue;
    if (kind === "row" || kind === "column" || kind === "cell" || kind === "identifiedItem" || kind === "formField" || kind === "structuredCardSection") {
      segments.push({ kind, id: identifier });
    }
  }
  return [blockLabel(blockId, context, t), ...describeSegments(block, segments, t)].join(" · ");
}

function orderItems(ids: readonly string[], context: BlockConflictPresentationContext, t: T): readonly string[] {
  return ids.map((id) => blockLabel(id, context, t));
}

function listDetail(id: string, label: string, ids: readonly string[], context: BlockConflictPresentationContext, t: T): ConflictPresentationDetail | null {
  return ids.length > 0 ? { id, label, value: { kind: "list", items: orderItems(ids, context, t) } } : null;
}

function text(value: string): ConflictDisplayValue {
  return { kind: "text", text: value };
}

const translatedTypes = new Set([
  "section", "heading", "richText", "spacer", "separator", "buttons", "image", "gallery", "carousel",
  "cardCollection", "steps", "testimonials", "form", "timeline", "card", "extendedCard", "structuredCard",
  "text", "email", "textarea", "select",
]);

function structuralType(value: unknown, t: T): string {
  const type = typeof value === "string"
    ? value
    : isRecord(value) && typeof (value["kind"] ?? value["type"]) === "string"
      ? String(value["kind"] ?? value["type"])
      : null;
  return type && translatedTypes.has(type) ? t(`types.${type}`) : t("types.unknown");
}

export type BlockInvariantPresentationKey =
  | "invalidStructure"
  | "multipleLcp"
  | "multipleH1"
  | "columnsMismatch"
  | "duplicateResource"
  | "invalidCombination";

const knownInvariantKeys: Readonly<Record<string, BlockInvariantPresentationKey>> = {
  BLOCKS_INVALID: "invalidStructure",
  BLOCKS_MULTIPLE_LCP_DETECTED: "multipleLcp",
  HEADING_CELL_UNIQUE_H1: "multipleH1",
  BLOCK_COLUMNS_COUNT_MISMATCH: "columnsMismatch",
  BLOCK_SECTION_COLUMNS_INVALID: "columnsMismatch",
  BLOCK_ID_DUPLICATE: "duplicateResource",
  BLOCK_ROW_ID_DUPLICATE: "duplicateResource",
  BLOCK_COLUMN_ID_DUPLICATE: "duplicateResource",
  CELL_ID_DUPLICATE: "duplicateResource",
  CELL_ITEM_ID_DUPLICATE: "duplicateResource",
};

export function blockInvariantPresentationKey(invariant: string): BlockInvariantPresentationKey {
  return knownInvariantKeys[invariant] ?? "invalidCombination";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled block conflict: ${String(value)}`);
}

export function getBlockConflictPresentationId(path: string): string {
  let hash = 2166136261;
  for (const character of path) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `block-conflict-${(hash >>> 0).toString(36)}`;
}

function comparison(conflict: Extract<BlockConflict, { kind: "fieldConflict" | "blockChangedBeforeDelete" | "blockTypeChanged" | "cellTypeChanged" | "itemTypeChanged" | "collectionIncompatible" }>, context: BlockConflictPresentationContext, t: T) {
  if (conflict.kind === "blockChangedBeforeDelete") {
    return {
      baseline: text(t("blocks.named", { name: conflict.baseline.name })),
      server: text(t("blocks.named", { name: conflict.current.name })),
      local: text(t("deleteRequested")),
    };
  }
  return {
    baseline: display(conflict.baseline, t, context, conflict.kind === "fieldConflict" ? conflict.location : undefined),
    server: display(conflict.current, t, context, conflict.kind === "fieldConflict" ? conflict.location : undefined),
    local: display(conflict.local, t, context, conflict.kind === "fieldConflict" ? conflict.location : undefined),
  };
}

export function toBlockConflictPresentation(
  details: PageBlocksConflictDetails,
  t: T,
  context: BlockConflictPresentationContext = { currentBlocks: details.current.blocks },
): readonly ConflictPresentationGroup[] {
  const items: ConflictPresentationGroup["items"][number][] = details.conflicts.map((conflict) => {
    const id = getBlockConflictPresentationId(conflict.path);
    switch (conflict.kind) {
      case "fieldConflict":
        return {
          id,
          label: describeBlockFieldLocation(conflict, context, t),
          status: "conflict",
          resolutionMode: "choice",
          comparison: comparison(conflict, context, t),
        };
      case "blockDeleted":
        return {
          id,
          label: t("kinds.blockDeleted"),
          context: blockLabel(conflict.blockId, context, t),
          status: "conflict",
          resolutionMode: "choice",
          options: {
            server: t("choices.keepDeletion"),
            local: t("choices.recreateBlock"),
          },
          details: [
            { id: "saved", label: t("savedState"), value: text(t("blocks.deleted")) },
            { id: "local", label: t("localState"), value: text(context.candidateBlock ? t("localDraft") : t("localDraftUnavailable")) },
          ],
        };
      case "blockChangedBeforeDelete":
        return {
          id,
          label: t("kinds.blockChangedBeforeDelete"),
          status: "conflict",
          resolutionMode: "choice",
          comparison: comparison(conflict, context, t),
          options: {
            server: t("choices.keepSavedBlock"),
            local: t("choices.keepDeletion"),
          },
        };
      case "blockTypeChanged":
      case "cellTypeChanged":
      case "itemTypeChanged":
        return {
          id,
          label: t(`kinds.${conflict.kind}`),
          context: structuralContext(conflict.path, context, t),
          status: "conflict",
          resolutionMode: "choice",
          options: {
            server: t("choices.useSavedStructure"),
            local: t("choices.keepLocalStructure"),
          },
          details: [
            { id: "initial-type", label: t("structural.initialType"), value: text(structuralType(conflict.baseline, t)) },
            { id: "saved-type", label: t("structural.savedType"), value: text(structuralType(conflict.current, t)) },
            { id: "local-type", label: t("structural.localType"), value: text(structuralType(conflict.local, t)) },
          ],
        };
      case "collectionIncompatible":
        return {
          id,
          label: t("kinds.collectionIncompatible"),
          context: structuralContext(conflict.path, context, t),
          status: "conflict",
          resolutionMode: "choice",
          options: {
            server: t("choices.useSavedStructure"),
            local: t("choices.keepLocalStructure"),
          },
          details: [
            { id: "operation", label: t("structural.localOperation"), value: text(t(`operations.${details.operation}`)) },
            { id: "saved-state", label: t("structural.savedState"), value: display(conflict.current, t, context) },
            { id: "reason", label: t("reason"), value: text(t("collectionIncompatibleReason")) },
          ],
        };
      case "orderIncompatible": {
        const baselineSet = new Set(conflict.baselineOrder);
        const currentSet = new Set(conflict.currentOrder);
        const localSet = new Set(conflict.localOrder);
        const detailsList = [
          listDetail("baseline-order", t("order.baseline"), conflict.baselineOrder, context, t),
          listDetail("current-order", t("order.current"), conflict.currentOrder, context, t),
          listDetail("local-order", t("order.local"), conflict.localOrder, context, t),
          listDetail("added-server", t("order.addedServer"), conflict.currentOrder.filter((value) => !baselineSet.has(value)), context, t),
          listDetail("removed-server", t("order.removedServer"), conflict.baselineOrder.filter((value) => !currentSet.has(value)), context, t),
          listDetail("added-local", t("order.addedLocal"), conflict.localOrder.filter((value) => !baselineSet.has(value)), context, t),
          listDetail("removed-local", t("order.removedLocal"), conflict.baselineOrder.filter((value) => !localSet.has(value)), context, t),
        ].filter((detail): detail is ConflictPresentationDetail => detail !== null);
        return {
          id,
          label: t("order.saved"),
          status: "conflict",
          resolutionMode: "choice",
          details: detailsList,
          options: {
            server: t("choices.useSavedOrder"),
            local: t("choices.keepLocalOrder"),
          },
        };
      }
      case "idReused": {
        const kind = resourceKindFromPath(conflict.path);
        return { id, label: t(`idReused.${kind}`), context: structuralContext(conflict.path, context, t), status: "conflict", resolutionMode: "choice", options: { server: t("choices.useSavedStructure"), local: t("choices.keepLocalStructure") }, details: [{ id: "reason", label: t("reason"), value: text(t("idReused.explanation")) }] };
      }
      case "anchorMissing": {
        const anchorKind = findBlock(conflict.id, context)
          ? "block"
          : resourceKindFromPath(conflict.path);
        return {
          id,
          label: t("kinds.anchorMissing"),
          status: "conflict",
          resolutionMode: "choice",
          options: {
            server: t("choices.keepSavedState"),
            local: t("choices.retryLocalOperation"),
          },
          details: [
            { id: "operation", label: t("anchorDetails.operation"), value: text(t(`operations.${details.operation}`)) },
            { id: "type", label: t("anchorDetails.type"), value: text(t(`anchorDetails.types.${anchorKind}`)) },
            { id: "resource", label: t("anchorDetails.resource"), value: text(blockLabel(conflict.id, context, t)) },
            { id: "state", label: t("anchorDetails.state"), value: text(t("anchorDetails.missingState")) },
          ],
        };
      }
      case "globalInvariant":
        return { id, label: t("kinds.globalInvariant"), status: "conflict", resolutionMode: "choice", options: { server: t("choices.keepSavedState"), local: t("choices.retryLocalOperation") }, details: [{ id: "invariant", label: t("reason"), value: text(t(`invariants.${blockInvariantPresentationKey(conflict.invariant)}`)) }] };
      case "revisionAhead":
        return { id, label: t("kinds.revisionAhead"), status: "conflict", resolutionMode: "choice", options: { server: t("choices.keepSavedState"), local: t("choices.retryLocalOperation") }, details: [{ id: "expected", label: t("revision.expected"), value: text(String(conflict.expectedBlocksRevision)) }, { id: "current", label: t("revision.current"), value: text(String(conflict.currentBlocksRevision)) }] };
      default:
        return assertNever(conflict);
    }
  });
  if (details.conflictKind === "contention") {
    items.push({ id: "contention", label: t("kinds.contention"), status: "conflict", resolutionMode: "choice", options: { server: t("choices.keepSavedState"), local: t("choices.retryLocalOperation") }, details: [{ id: "reason", label: t("reason"), value: text(t("contentionExplanation")) }] });
  }
  return [{ id: "block-conflicts", items }];
}
