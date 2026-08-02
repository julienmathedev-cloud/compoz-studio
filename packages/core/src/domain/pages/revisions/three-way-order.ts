/**
 * @file packages/core/src/domain/pages/revisions/three-way-order.ts
 * @layer core/domain/pages/revisions
 * @description Pure deterministic three-way ordering for persisted identities.
 */

export type ThreeWayOrderConflict = Readonly<{
  path: string;
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  addedIds: ReadonlyArray<string>;
  removedIds: ReadonlyArray<string>;
}>;

export type ThreeWayOrderResolution =
  | Readonly<{ status: "resolved"; order: ReadonlyArray<string> }>
  | Readonly<{ status: "conflict"; conflict: ThreeWayOrderConflict }>;

function relation(order: ReadonlyArray<string>, left: string, right: string) {
  return order.indexOf(left) < order.indexOf(right);
}

function validateOrder(order: ReadonlyArray<string>, path: string): boolean {
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
}>): ThreeWayOrderResolution {
  const { baselineOrder, localOrder, currentOrder, path } = input;
  const baselineSet = new Set(baselineOrder);
  const localSet = new Set(localOrder);
  const currentSet = new Set(currentOrder);
  const addedIds = currentOrder.filter((id) => !baselineSet.has(id));
  const removedIds = baselineOrder.filter((id) => !currentSet.has(id));
  const conflict = (): ThreeWayOrderResolution => ({
    status: "conflict",
    conflict: {
      path,
      baselineOrder,
      localOrder,
      currentOrder,
      addedIds,
      removedIds,
    },
  });

  if (
    !validateOrder(baselineOrder, path) ||
    !validateOrder(localOrder, path) ||
    !validateOrder(currentOrder, path) ||
    localOrder.length !== baselineOrder.length ||
    localOrder.some((id) => !baselineSet.has(id)) ||
    baselineOrder.some((id) => !localSet.has(id))
  ) {
    return conflict();
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
        return conflict();
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

  return output.length === nodes.length
    ? { status: "resolved", order: output }
    : conflict();
}
