/**
 * @file apps/studio/src/features/settings/conflicts/settings-list-resolution.ts
 * @layer studio/features/settings/conflicts
 * @description Deterministic three-way resolution for identified Settings lists.
 */

import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import {
  classifyConflictValue,
  resolutionModeForStatus,
  type ConflictPresentationStatus,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";

export type SettingsListNode = Readonly<{
  id: string;
  parentId: string | null;
  value: Readonly<Record<string, unknown>>;
}>;

export type SettingsListDefinition<TValue> = Readonly<{
  propertyKeys: readonly string[];
  toNodes: (value: TValue) => readonly SettingsListNode[];
  fromNodes: (nodes: readonly SettingsListNode[]) => TValue;
}>;

export type SettingsListManualReason =
  | "duplicate-id"
  | "order-incompatible"
  | "missing-parent";

export type SettingsListChange = Readonly<{
  id: string;
  kind: "addition" | "removal" | "presence" | "property" | "order" | "manual";
  status: ConflictPresentationStatus;
  resolutionMode: "automatic" | "choice" | "manual";
  choice?: ConflictResolutionChoice;
  itemId?: string;
  property?: string;
  parentId?: string | null;
  baseline?: unknown;
  server?: unknown;
  local?: unknown;
  baselineNode?: SettingsListNode;
  serverNode?: SettingsListNode;
  localNode?: SettingsListNode;
  baselineNodes?: readonly SettingsListNode[];
  serverNodes?: readonly SettingsListNode[];
  localNodes?: readonly SettingsListNode[];
  reason?: SettingsListManualReason;
}>;

export type SettingsListResolutionResult<TValue> =
  | Readonly<{ status: "resolved"; value: TValue }>
  | Readonly<{ status: "incomplete"; missingChoices: readonly string[] }>
  | Readonly<{ status: "manual"; reason: SettingsListManualReason }>;

export type SettingsListResolutionAnalysis<TValue> = Readonly<{
  changes: readonly SettingsListChange[];
  result: SettingsListResolutionResult<TValue>;
}>;

type NodeMaps = Readonly<{
  baseline: ReadonlyMap<string, SettingsListNode>;
  server: ReadonlyMap<string, SettingsListNode>;
  local: ReadonlyMap<string, SettingsListNode>;
}>;

const ROOT_PARENT = "__root__";

function parentKey(parentId: string | null): string {
  return parentId ?? ROOT_PARENT;
}

function equalSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function uniqueNodeMap(nodes: readonly SettingsListNode[]): ReadonlyMap<string, SettingsListNode> | null {
  const map = new Map<string, SettingsListNode>();
  for (const node of nodes) {
    if (map.has(node.id)) return null;
    map.set(node.id, node);
  }
  return map;
}

function nodeProperty(node: SettingsListNode | undefined, property: string): unknown {
  return property === "parentId" ? node?.parentId : node?.value[property];
}

function withNodeProperty(
  node: SettingsListNode,
  property: string,
  value: unknown,
): SettingsListNode {
  return property === "parentId"
    ? { ...node, parentId: typeof value === "string" ? value : null }
    : { ...node, value: { ...node.value, [property]: value } };
}

function nodesEqual(
  left: SettingsListNode,
  right: SettingsListNode,
  properties: readonly string[],
): boolean {
  return properties.every((property) =>
    equalJsonValue(nodeProperty(left, property), nodeProperty(right, property)),
  );
}

function sourceSequence(
  nodes: readonly SettingsListNode[],
  parentId: string | null,
  allowed: ReadonlySet<string>,
): readonly string[] {
  return nodes
    .filter((node) => node.parentId === parentId && allowed.has(node.id))
    .map((node) => node.id);
}

function orderChanges(
  baselineNodes: readonly SettingsListNode[],
  serverNodes: readonly SettingsListNode[],
  localNodes: readonly SettingsListNode[],
  maps: NodeMaps,
  choices: Readonly<Record<string, ConflictResolutionChoice>>,
): readonly SettingsListChange[] {
  const parents = new Set<string | null>([
    ...baselineNodes.map((node) => node.parentId),
    ...serverNodes.map((node) => node.parentId),
    ...localNodes.map((node) => node.parentId),
  ]);
  const changes: SettingsListChange[] = [];
  for (const parentId of parents) {
    const stableIds = new Set(baselineNodes.flatMap((node) => {
      const server = maps.server.get(node.id);
      const local = maps.local.get(node.id);
      return node.parentId === parentId && server?.parentId === parentId && local?.parentId === parentId
        ? [node.id]
        : [];
    }));
    if (stableIds.size < 2) continue;
    const baseline = sourceSequence(baselineNodes, parentId, stableIds);
    const server = sourceSequence(serverNodes, parentId, stableIds);
    const local = sourceSequence(localNodes, parentId, stableIds);
    const status = classifyConflictValue(baseline, server, local, equalSequence);
    if (!status) continue;
    const id = `items:order:${parentKey(parentId)}`;
    changes.push({
      id,
      kind: "order",
      status,
      resolutionMode: status === "conflict" ? "manual" : resolutionModeForStatus(status),
      choice: choices[id],
      parentId,
      baselineNodes: baseline.map((itemId) => maps.baseline.get(itemId)).filter((node): node is SettingsListNode => Boolean(node)),
      serverNodes: server.map((itemId) => maps.server.get(itemId)).filter((node): node is SettingsListNode => Boolean(node)),
      localNodes: local.map((itemId) => maps.local.get(itemId)).filter((node): node is SettingsListNode => Boolean(node)),
      reason: status === "conflict" ? "order-incompatible" : undefined,
    });
  }
  return changes;
}

function mergedGroupOrder(input: Readonly<{
  parentId: string | null;
  resolvedIds: readonly string[];
  baselineNodes: readonly SettingsListNode[];
  serverNodes: readonly SettingsListNode[];
  localNodes: readonly SettingsListNode[];
  maps: NodeMaps;
}>): readonly string[] | null {
  const allowed = new Set(input.resolvedIds);
  const baseline = sourceSequence(input.baselineNodes, input.parentId, allowed);
  const server = sourceSequence(input.serverNodes, input.parentId, allowed);
  const local = sourceSequence(input.localNodes, input.parentId, allowed);
  const stable = new Set(input.resolvedIds.filter((id) =>
    input.maps.baseline.get(id)?.parentId === input.parentId &&
    input.maps.server.get(id)?.parentId === input.parentId &&
    input.maps.local.get(id)?.parentId === input.parentId,
  ));
  const baselineCore = baseline.filter((id) => stable.has(id));
  const serverCore = server.filter((id) => stable.has(id));
  const localCore = local.filter((id) => stable.has(id));
  const serverChanged = !equalSequence(serverCore, baselineCore);
  const localChanged = !equalSequence(localCore, baselineCore);
  if (serverChanged && localChanged && !equalSequence(serverCore, localCore)) return null;

  const primary = localChanged && !serverChanged ? local : server;
  const secondary = primary === server ? local : server;
  const graph = new Map(input.resolvedIds.map((id) => [id, new Set<string>()] as const));
  const addEdges = (sequence: readonly string[], additionsOnly: boolean) => {
    for (let index = 1; index < sequence.length; index++) {
      const before = sequence[index - 1];
      const after = sequence[index];
      if (!before || !after || before === after) continue;
      if (additionsOnly && stable.has(before) && stable.has(after)) continue;
      graph.get(before)?.add(after);
    }
  };
  addEdges(primary, false);
  addEdges(secondary, serverChanged !== localChanged);

  const indegree = new Map<string, number>(input.resolvedIds.map((id) => [id, 0] as const));
  for (const destinations of graph.values()) {
    for (const destination of destinations) {
      indegree.set(destination, (indegree.get(destination) ?? 0) + 1);
    }
  }
  const sourceRank = (id: string): readonly [number, number, number, string] => {
    const missing = Number.MAX_SAFE_INTEGER;
    const primaryIndex = primary.indexOf(id);
    const secondaryIndex = secondary.indexOf(id);
    const baselineIndex = baseline.indexOf(id);
    return [
      primaryIndex < 0 ? missing : primaryIndex,
      secondaryIndex < 0 ? missing : secondaryIndex,
      baselineIndex < 0 ? missing : baselineIndex,
      id,
    ];
  };
  const compare = (left: string, right: string) => {
    const a = sourceRank(left);
    const b = sourceRank(right);
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3].localeCompare(b[3]);
  };
  const available = input.resolvedIds.filter((id) => indegree.get(id) === 0).sort(compare);
  const ordered: string[] = [];
  while (available.length > 0) {
    const id = available.shift();
    if (!id) break;
    ordered.push(id);
    for (const destination of graph.get(id) ?? []) {
      const next = (indegree.get(destination) ?? 0) - 1;
      indegree.set(destination, next);
      if (next === 0) {
        available.push(destination);
        available.sort(compare);
      }
    }
  }
  return ordered.length === input.resolvedIds.length ? ordered : null;
}

function orderResolvedNodes(input: Readonly<{
  nodes: readonly SettingsListNode[];
  baselineNodes: readonly SettingsListNode[];
  serverNodes: readonly SettingsListNode[];
  localNodes: readonly SettingsListNode[];
  maps: NodeMaps;
}>): Readonly<{ status: "resolved"; nodes: readonly SettingsListNode[] }> | Readonly<{ status: "manual"; reason: SettingsListManualReason }> {
  const byId = new Map(input.nodes.map((node) => [node.id, node] as const));
  for (const node of input.nodes) {
    if (node.parentId !== null && !byId.has(node.parentId)) {
      return { status: "manual", reason: "missing-parent" };
    }
  }
  const groups = new Map<string, SettingsListNode[]>();
  for (const node of input.nodes) {
    const key = parentKey(node.parentId);
    const group = groups.get(key) ?? [];
    group.push(node);
    groups.set(key, group);
  }
  const orderedByParent = new Map<string, readonly string[]>();
  for (const group of groups.values()) {
    const parentId = group[0]?.parentId ?? null;
    const ordered = mergedGroupOrder({
      parentId,
      resolvedIds: group.map((node) => node.id),
      baselineNodes: input.baselineNodes,
      serverNodes: input.serverNodes,
      localNodes: input.localNodes,
      maps: input.maps,
    });
    if (!ordered) return { status: "manual", reason: "order-incompatible" };
    orderedByParent.set(parentKey(parentId), ordered);
  }
  const orderedNodes: SettingsListNode[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const append = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    const node = byId.get(id);
    if (!node) return false;
    visiting.add(id);
    visited.add(id);
    orderedNodes.push(node);
    for (const childId of orderedByParent.get(parentKey(id)) ?? []) {
      if (!append(childId)) return false;
    }
    visiting.delete(id);
    return true;
  };
  for (const rootId of orderedByParent.get(ROOT_PARENT) ?? []) {
    if (!append(rootId)) return { status: "manual", reason: "missing-parent" };
  }
  return orderedNodes.length === input.nodes.length
    ? { status: "resolved", nodes: orderedNodes }
    : { status: "manual", reason: "missing-parent" };
}

export function analyzeSettingsListResolution<TValue>(input: Readonly<{
  baseline: TValue;
  server: TValue;
  local: TValue;
  choices: Readonly<Record<string, ConflictResolutionChoice>>;
  definition: SettingsListDefinition<TValue>;
}>): SettingsListResolutionAnalysis<TValue> {
  const baselineNodes = input.definition.toNodes(input.baseline);
  const serverNodes = input.definition.toNodes(input.server);
  const localNodes = input.definition.toNodes(input.local);
  const baseline = uniqueNodeMap(baselineNodes);
  const server = uniqueNodeMap(serverNodes);
  const local = uniqueNodeMap(localNodes);
  if (!baseline || !server || !local) {
    return {
      changes: [{ id: "items:duplicate", kind: "manual", status: "conflict", resolutionMode: "manual", reason: "duplicate-id" }],
      result: { status: "manual", reason: "duplicate-id" },
    };
  }
  const maps: NodeMaps = { baseline, server, local };
  const changes: SettingsListChange[] = [
    ...orderChanges(baselineNodes, serverNodes, localNodes, maps, input.choices),
  ];
  const incompatibleOrder = changes.some((change) => change.kind === "order" && change.resolutionMode === "manual");
  const missingChoices: string[] = [];
  const resolvedNodes: SettingsListNode[] = [];
  const ids = new Set([
    ...baselineNodes.map((node) => node.id),
    ...serverNodes.map((node) => node.id),
    ...localNodes.map((node) => node.id),
  ]);

  for (const id of ids) {
    const initial = baseline.get(id);
    const current = server.get(id);
    const draft = local.get(id);
    if (!initial) {
      if (current && !draft) {
        changes.push({ id: `items:${id}:addition`, itemId: id, kind: "addition", status: "server-only", resolutionMode: "automatic", serverNode: current });
        resolvedNodes.push(current);
        continue;
      }
      if (!current && draft) {
        changes.push({ id: `items:${id}:addition`, itemId: id, kind: "addition", status: "local-only", resolutionMode: "automatic", localNode: draft });
        resolvedNodes.push(draft);
        continue;
      }
      if (!current || !draft) continue;
      if (nodesEqual(current, draft, input.definition.propertyKeys)) {
        changes.push({ id: `items:${id}:addition`, itemId: id, kind: "addition", status: "same-change", resolutionMode: "automatic", serverNode: current, localNode: draft });
        resolvedNodes.push(current);
        continue;
      }
    }

    if (initial && !current && !draft) {
      changes.push({ id: `items:${id}:removal`, itemId: id, kind: "removal", status: "same-change", resolutionMode: "automatic", baselineNode: initial });
      continue;
    }
    if (initial && (!current || !draft)) {
      const remaining = current ?? draft;
      if (!remaining) continue;
      const changed = !nodesEqual(initial, remaining, input.definition.propertyKeys);
      if (!changed) {
        changes.push({
          id: `items:${id}:removal`, itemId: id, kind: "removal",
          status: current ? "local-only" : "server-only", resolutionMode: "automatic",
          baselineNode: initial, serverNode: current, localNode: draft,
        });
        continue;
      }
      const choiceId = `items:${id}:presence`;
      const choice = input.choices[choiceId];
      changes.push({
        id: choiceId, itemId: id, kind: "presence", status: "conflict", resolutionMode: "choice", choice,
        baselineNode: initial, serverNode: current, localNode: draft,
      });
      if (!choice) missingChoices.push(choiceId);
      const chosen = choice === "server" ? current : choice === "local" ? draft : undefined;
      if (chosen) resolvedNodes.push(chosen);
      continue;
    }
    if (!current || !draft) continue;

    let resolved = current;
    for (const property of input.definition.propertyKeys) {
      const baselineValue = nodeProperty(initial, property);
      const serverValue = nodeProperty(current, property);
      const localValue = nodeProperty(draft, property);
      const status = classifyConflictValue(baselineValue, serverValue, localValue, equalJsonValue);
      if (!status) continue;
      const choiceId = `items:${id}:property:${property}`;
      const choice = input.choices[choiceId];
      changes.push({
        id: choiceId, itemId: id, kind: "property", property, status,
        resolutionMode: resolutionModeForStatus(status), choice,
        baseline: baselineValue, server: serverValue, local: localValue,
        baselineNode: initial, serverNode: current, localNode: draft,
      });
      if (status === "conflict" && !choice) missingChoices.push(choiceId);
      const value = status === "local-only" || (status === "conflict" && choice === "local")
        ? localValue
        : serverValue;
      resolved = withNodeProperty(resolved, property, value);
    }
    resolvedNodes.push(resolved);
  }

  if (incompatibleOrder) {
    return { changes, result: { status: "manual", reason: "order-incompatible" } };
  }
  if (missingChoices.length > 0) {
    return { changes, result: { status: "incomplete", missingChoices } };
  }
  const ordered = orderResolvedNodes({
    nodes: resolvedNodes,
    baselineNodes,
    serverNodes,
    localNodes,
    maps,
  });
  if (ordered.status === "manual") {
    return {
      changes: [...changes, { id: `items:manual:${ordered.reason}`, kind: "manual", status: "conflict", resolutionMode: "manual", reason: ordered.reason }],
      result: ordered,
    };
  }
  return {
    changes,
    result: { status: "resolved", value: input.definition.fromNodes(ordered.nodes) },
  };
}
