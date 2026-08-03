/**
 * @file apps/studio/src/features/pages/blocks/conflicts/resolve-block-conflict.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Applies explicit local/remote choices to the server-provided safe candidate.
 */

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import type {
  BlockFieldConflict,
  BlockFieldLocationSegment,
  BlockOrderConflict,
  PageBlocksConflictDetails,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { BlockSchema } from "@compoz/validation/pages/blocks/block";

export type BlockConflictChoice = "local" | "remote";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function replaceIdentified(
  owner: Readonly<Record<string, unknown>>,
  collection: string,
  id: string,
  remaining: ReadonlyArray<BlockFieldLocationSegment>,
  value: unknown,
): Readonly<Record<string, unknown>> {
  const items = owner[collection];
  if (!Array.isArray(items)) return owner;
  return {
    ...owner,
    [collection]: items.map((item) =>
      isRecord(item) && item["id"] === id
        ? applySegments(item, remaining, value)
        : item,
    ),
  };
}

function applySegments(
  target: unknown,
  segments: ReadonlyArray<BlockFieldLocationSegment>,
  value: unknown,
): unknown {
  const [segment, ...remaining] = segments;
  if (!segment || !isRecord(target)) return target;

  switch (segment.kind) {
    case "row":
      return replaceIdentified(target, "rows", segment.id, remaining, value);
    case "column":
      return replaceIdentified(target, "columns", segment.id, remaining, value);
    case "cell":
      return replaceIdentified(target, "cells", segment.id, remaining, value);
    case "identifiedItem":
      return replaceIdentified(target, "items", segment.id, remaining, value);
    case "formField":
      return replaceIdentified(target, "fields", segment.id, remaining, value);
    case "structuredCardSection":
      return replaceIdentified(target, "sections", segment.id, remaining, value);
    case "image":
      return {
        ...target,
        image: applySegments(target["image"], remaining, value),
      };
    case "field": {
      if (remaining.length > 0) {
        return {
          ...target,
          [segment.name]: applySegments(
            target[segment.name],
            remaining,
            value,
          ),
        };
      }
      if (segment.name === "media" && isRecord(value)) {
        return { ...target, ...value };
      }
      return { ...target, [segment.name]: value };
    }
  }
}

function applyRemoteField(
  candidate: SectionBlock,
  conflict: BlockFieldConflict,
): SectionBlock {
  if (conflict.location.kind === "globalLcpOwner") {
    return {
      ...candidate,
      lcpPriority: conflict.current === candidate.id,
    };
  }
  if (conflict.location.blockId !== candidate.id) return candidate;
  return applySegments(
    candidate,
    conflict.location.segments,
    conflict.current,
  ) as SectionBlock;
}

const ORDERED_COLLECTIONS = new Set([
  "rows",
  "columns",
  "cells",
  "items",
  "fields",
  "sections",
] as const);

type OrderedCollection = "rows" | "columns" | "cells" | "items" | "fields" | "sections";
type OrderPathSegment = Readonly<{
  collection: OrderedCollection;
  id?: string;
}>;

function parseOrderPath(
  path: string,
  blockId: string,
): readonly OrderPathSegment[] | null {
  const prefix = `blocks[${blockId}]`;
  if (!path.startsWith(prefix)) return null;
  const suffix = path.slice(prefix.length);
  const segments: OrderPathSegment[] = [];
  const pattern = /\.(rows|columns|cells|items|fields|sections)(?:\[([^\]]+)\])?/guy;
  let offset = 0;
  while (offset < suffix.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(suffix);
    if (!match || match.index !== offset) return null;
    const collection = match[1];
    if (!ORDERED_COLLECTIONS.has(collection as OrderedCollection)) return null;
    segments.push({
      collection: collection as OrderedCollection,
      ...(match[2] === undefined ? {} : { id: match[2] }),
    });
    offset = pattern.lastIndex;
  }
  if (segments.length === 0) return null;
  return segments.every((segment, index) =>
    index === segments.length - 1 ? segment.id === undefined : segment.id !== undefined,
  )
    ? segments
    : null;
}

function reorderIdentifiedValues(
  values: readonly unknown[],
  selectedOrder: readonly string[],
): readonly unknown[] | null {
  const identified = values.filter(
    (value): value is Readonly<Record<string, unknown>> & Readonly<{ id: string }> =>
      isRecord(value) && typeof value["id"] === "string",
  );
  const candidateIds = identified.map((value) => value.id);
  if (
    identified.length !== values.length ||
    new Set(candidateIds).size !== candidateIds.length ||
    new Set(selectedOrder).size !== selectedOrder.length
  ) {
    return null;
  }
  const candidateSet = new Set(candidateIds);
  const selectedIds = selectedOrder.filter((id) => candidateSet.has(id));
  const selectedSet = new Set(selectedIds);
  const remainingIds = candidateIds.filter((id) => !selectedSet.has(id));
  const byId = new Map(identified.map((value) => [value.id, value]));
  return [...selectedIds, ...remainingIds].map((id) => byId.get(id)!);
}

function applyOrderAtPath(
  owner: unknown,
  segments: readonly OrderPathSegment[],
  selectedOrder: readonly string[],
): unknown | null {
  if (!isRecord(owner)) return null;
  const [segment, ...remaining] = segments;
  if (!segment) return null;
  const collection = owner[segment.collection];
  if (!Array.isArray(collection)) return null;

  if (remaining.length === 0) {
    const reordered = reorderIdentifiedValues(collection, selectedOrder);
    return reordered ? { ...owner, [segment.collection]: reordered } : null;
  }
  if (!segment.id) return null;
  const matching = collection.filter(
    (value) => isRecord(value) && value["id"] === segment.id,
  );
  if (matching.length !== 1) return null;
  const updated = applyOrderAtPath(matching[0], remaining, selectedOrder);
  if (!updated) return null;
  return {
    ...owner,
    [segment.collection]: collection.map((value) =>
      isRecord(value) && value["id"] === segment.id ? updated : value,
    ),
  };
}

function applyOrderChoice(
  candidate: SectionBlock,
  conflict: BlockOrderConflict,
  choice: BlockConflictChoice,
): SectionBlock | null {
  const segments = parseOrderPath(conflict.path, candidate.id);
  if (!segments) return null;
  return applyOrderAtPath(
    candidate,
    segments,
    choice === "remote" ? conflict.currentOrder : conflict.localOrder,
  ) as SectionBlock | null;
}

export function resolveBlockConflictCandidate(input: Readonly<{
  details: PageBlocksConflictDetails;
  choices: Readonly<Record<number, BlockConflictChoice>>;
}>): SectionBlock | null {
  const candidate = input.details.candidateBlock;
  if (!candidate || candidate.type !== "section") return null;

  let resolved: SectionBlock | null = candidate;
  for (const [index, conflict] of input.details.conflicts.entries()) {
    if (!resolved) return null;
    const choice = input.choices[index];
    if (conflict.kind === "fieldConflict" && choice === "remote") {
      resolved = applyRemoteField(resolved, conflict);
      continue;
    }
    if (conflict.kind === "orderIncompatible") {
      if (!choice) return null;
      resolved = applyOrderChoice(resolved, conflict, choice);
    }
  }
  const validated = BlockSchema.safeParse(resolved);
  return validated.success ? resolved : null;
}
