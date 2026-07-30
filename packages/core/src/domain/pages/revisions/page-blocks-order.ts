/**
 * @file packages/core/src/domain/pages/revisions/page-blocks-order.ts
 * @layer core/domain/pages/revisions
 * @description Pure deterministic three-way ordering for persisted block identities.
 */

import type { BlockOrderConflict } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export type OrderResolution =
  | Readonly<{ status: "resolved"; order: ReadonlyArray<string> }>
  | Readonly<{ status: "conflict"; conflict: BlockOrderConflict }>;

function relation(order: ReadonlyArray<string>, left: string, right: string) {
  return order.indexOf(left) < order.indexOf(right);
}

function conflict(input: Readonly<{
  path: string;
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  addedBlockIds: ReadonlyArray<string>;
  removedBlockIds: ReadonlyArray<string>;
}>): OrderResolution {
  return {
    status: "conflict",
    conflict: { kind: "orderIncompatible", ...input },
  };
}

function validateOrder(
  order: ReadonlyArray<string>,
  path: string,
): boolean {
  return (
    order.every((id) => typeof id === "string" && id.trim().length > 0) &&
    new Set(order).size === order.length &&
    path.length > 0
  );
}

/**
 * Merges changed pair relations, then preserves current placement for remotely
 * added IDs. Current rank and lexical ID make the topological result stable.
 */
export function resolveThreeWayOrder(input: Readonly<{
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  path: string;
}>): OrderResolution {
  const { baselineOrder, localOrder, currentOrder, path } = input;
  const baselineSet = new Set(baselineOrder);
  const localSet = new Set(localOrder);
  const currentSet = new Set(currentOrder);
  const addedBlockIds = currentOrder.filter((id) => !baselineSet.has(id));
  const removedBlockIds = baselineOrder.filter((id) => !currentSet.has(id));

  if (
    !validateOrder(baselineOrder, path) ||
    !validateOrder(localOrder, path) ||
    !validateOrder(currentOrder, path) ||
    localOrder.length !== baselineOrder.length ||
    localOrder.some((id) => !baselineSet.has(id)) ||
    baselineOrder.some((id) => !localSet.has(id))
  ) {
    return conflict({
      path,
      baselineOrder,
      localOrder,
      currentOrder,
      addedBlockIds,
      removedBlockIds,
    });
  }

  const nodes = [...currentOrder];
  const edges = new Map(nodes.map((id) => [id, new Set<string>()]));
  const survivingBaseline = baselineOrder.filter((id) => currentSet.has(id));

  for (let leftIndex = 0; leftIndex < survivingBaseline.length; leftIndex++) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < survivingBaseline.length;
      rightIndex++
    ) {
      const left = survivingBaseline[leftIndex];
      const right = survivingBaseline[rightIndex];
      const baselineBefore = relation(baselineOrder, left, right);
      const localBefore = relation(localOrder, left, right);
      const currentBefore = relation(currentOrder, left, right);
      const localChanged = localBefore !== baselineBefore;
      const currentChanged = currentBefore !== baselineBefore;

      if (localChanged && currentChanged && localBefore !== currentBefore) {
        return conflict({
          path,
          baselineOrder,
          localOrder,
          currentOrder,
          addedBlockIds,
          removedBlockIds,
        });
      }

      const before = localChanged ? localBefore : currentBefore;
      edges.get(before ? left : right)?.add(before ? right : left);
    }
  }

  for (let index = 0; index < currentOrder.length - 1; index++) {
    const left = currentOrder[index];
    const right = currentOrder[index + 1];

    if (!baselineSet.has(left) || !baselineSet.has(right)) {
      edges.get(left)?.add(right);
    }
  }

  const indegree = new Map(nodes.map((id) => [id, 0]));
  for (const targets of edges.values()) {
    for (const target of targets) {
      indegree.set(target, (indegree.get(target) ?? 0) + 1);
    }
  }

  const currentRank = new Map(currentOrder.map((id, index) => [id, index]));
  const ready = nodes.filter((id) => indegree.get(id) === 0);
  const output: string[] = [];
  const sortReady = () =>
    ready.sort(
      (left, right) =>
        (currentRank.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (currentRank.get(right) ?? Number.MAX_SAFE_INTEGER) ||
        left.localeCompare(right),
    );

  sortReady();
  while (ready.length > 0) {
    const next = ready.shift()!;
    output.push(next);

    for (const target of edges.get(next) ?? []) {
      const nextDegree = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, nextDegree);
      if (nextDegree === 0) {
        ready.push(target);
        sortReady();
      }
    }
  }

  if (output.length !== nodes.length) {
    return conflict({
      path,
      baselineOrder,
      localOrder,
      currentOrder,
      addedBlockIds,
      removedBlockIds,
    });
  }

  return { status: "resolved", order: output };
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
