/**
 * @file packages/core/src/domain/pages/revisions/page-blocks-order.ts
 * @layer core/domain/pages/revisions
 * @description Pure deterministic three-way ordering for persisted block identities.
 */

import { resolveThreeWayOrder as resolveGenericThreeWayOrder } from "@compoz/core/domain/pages/revisions/three-way-order";
import type { BlockOrderConflict } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export type OrderResolution =
  | Readonly<{ status: "resolved"; order: ReadonlyArray<string> }>
  | Readonly<{ status: "conflict"; conflict: BlockOrderConflict }>;

export function resolveThreeWayOrder(input: Readonly<{
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  path: string;
}>): OrderResolution {
  const resolution = resolveGenericThreeWayOrder(input);
  if (resolution.status === "resolved") return resolution;

  return {
    status: "conflict",
    conflict: {
      kind: "orderIncompatible",
      path: resolution.conflict.path,
      baselineOrder: resolution.conflict.baselineOrder,
      localOrder: resolution.conflict.localOrder,
      currentOrder: resolution.conflict.currentOrder,
      addedBlockIds: resolution.conflict.addedIds,
      removedBlockIds: resolution.conflict.removedIds,
    },
  };
}

export function placementAnchors(
  baselineOrder: ReadonlyArray<string>,
  placement:
    | Readonly<{ kind: "start" }>
    | Readonly<{ kind: "end" }>
    | Readonly<{ kind: "before"; blockId: string }>
    | Readonly<{ kind: "after"; blockId: string }>,
): Readonly<{ left: string | null; right: string | null }> | null {
  if (placement.kind === "start") {
    return { left: null, right: baselineOrder[0] ?? null };
  }
  if (placement.kind === "end") {
    return { left: baselineOrder.at(-1) ?? null, right: null };
  }

  const index = baselineOrder.indexOf(placement.blockId);
  if (index < 0) return null;

  return placement.kind === "before"
    ? {
        left: baselineOrder[index - 1] ?? null,
        right: placement.blockId,
      }
    : {
        left: placement.blockId,
        right: baselineOrder[index + 1] ?? null,
      };
}

export function insertInStableInterval(input: Readonly<{
  currentOrder: ReadonlyArray<string>;
  baselineOrder: ReadonlyArray<string>;
  blockId: string;
  left: string | null;
  right: string | null;
}>): ReadonlyArray<string> | null {
  return insertManyInStableInterval({
    ...input,
    blockIds: [input.blockId],
  });
}

export function insertManyInStableInterval(input: Readonly<{
  currentOrder: ReadonlyArray<string>;
  baselineOrder: ReadonlyArray<string>;
  blockIds: ReadonlyArray<string>;
  left: string | null;
  right: string | null;
}>): ReadonlyArray<string> | null {
  const { currentOrder, baselineOrder, blockIds, left, right } = input;
  const leftIndex = left === null ? -1 : currentOrder.indexOf(left);
  const rightIndex =
    right === null ? currentOrder.length : currentOrder.indexOf(right);
  const currentSet = new Set(currentOrder);
  const insertedSet = new Set(blockIds);

  if (
    (left !== null && leftIndex < 0) ||
    (right !== null && rightIndex < 0) ||
    leftIndex >= rightIndex ||
    currentSet.size !== currentOrder.length ||
    insertedSet.size !== blockIds.length ||
    blockIds.length === 0 ||
    blockIds.some((id) => currentSet.has(id))
  ) {
    return null;
  }

  const baselineSet = new Set(baselineOrder);
  const between = currentOrder.slice(leftIndex + 1, rightIndex);
  if (between.some((id) => baselineSet.has(id))) {
    return null;
  }

  const concurrent = between.filter((id) => !baselineSet.has(id));
  const canonicalConcurrent = [...concurrent].sort((a, b) =>
    a.localeCompare(b));
  if (
    concurrent.some((id, index) => id !== canonicalConcurrent[index]) ||
    (blockIds.length > 1 && concurrent.length > 0)
  ) {
    return null;
  }

  const stableInterval =
    blockIds.length === 1
      ? [...concurrent, ...blockIds].sort((a, b) => a.localeCompare(b))
      : [...blockIds];

  const result = [
    ...currentOrder.slice(0, leftIndex + 1),
    ...stableInterval,
    ...currentOrder.slice(rightIndex),
  ];
  const expected = new Set([...currentOrder, ...blockIds]);

  if (
    result.length !== currentOrder.length + blockIds.length ||
    new Set(result).size !== result.length ||
    result.some((id) => !expected.has(id)) ||
    [...expected].some((id) => !result.includes(id))
  ) {
    return null;
  }

  return result;
}
