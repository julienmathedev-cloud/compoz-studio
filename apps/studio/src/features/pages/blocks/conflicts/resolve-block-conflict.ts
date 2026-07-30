/**
 * @file apps/studio/src/features/pages/blocks/conflicts/resolve-block-conflict.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Applies explicit local/remote choices to the server-provided safe candidate.
 */

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import type {
  BlockFieldConflict,
  BlockFieldLocationSegment,
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

export function resolveBlockConflictCandidate(input: Readonly<{
  details: PageBlocksConflictDetails;
  choices: Readonly<Record<number, BlockConflictChoice>>;
}>): SectionBlock | null {
  const candidate = input.details.candidateBlock;
  if (!candidate || candidate.type !== "section") return null;

  const resolved = input.details.conflicts.reduce<SectionBlock>((next, conflict, index) => {
    if (
      conflict.kind !== "fieldConflict" ||
      input.choices[index] !== "remote"
    ) {
      return next;
    }
    return applyRemoteField(next, conflict);
  }, candidate);
  const validated = BlockSchema.safeParse(resolved);
  return validated.success ? resolved : null;
}
