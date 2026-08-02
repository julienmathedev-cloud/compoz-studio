/**
 * @file packages/core/src/domain/pages/revisions/three-way-order.test.ts
 * @layer core/domain/pages/revisions
 * @description Pure regression tests for shared order intent resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { resolveThreeWayOrder } from "@compoz/core/domain/pages/revisions/three-way-order";

function resolve(
  baselineOrder: string[],
  localOrder: string[],
  currentOrder: string[],
) {
  return resolveThreeWayOrder({ baselineOrder, localOrder, currentOrder, path: "test" });
}

void test("shared order resolution preserves equal and one-sided orders", () => {
  for (const [localOrder, currentOrder, expected] of [
    [["a", "b", "c"], ["a", "b", "c"], ["a", "b", "c"]],
    [["b", "a", "c"], ["a", "b", "c"], ["b", "a", "c"]],
    [["a", "b", "c"], ["a", "c", "b"], ["a", "c", "b"]],
  ] as const) {
    const result = resolve(["a", "b", "c"], [...localOrder], [...currentOrder]);
    assert.equal(result.status, "resolved");
    if (result.status === "resolved") assert.deepEqual(result.order, expected);
  }
});

void test("shared order resolution merges compatible independent intents", () => {
  const result = resolve(
    ["a", "b", "c", "d"],
    ["a", "b", "d", "c"],
    ["b", "a", "c", "d"],
  );
  assert.equal(result.status, "resolved");
  if (result.status === "resolved") assert.deepEqual(result.order, ["b", "a", "d", "c"]);
});

void test("shared order resolution rejects incompatible pair relations", () => {
  assert.equal(
    resolve(["a", "b", "c"], ["b", "a", "c"], ["a", "c", "b"]).status,
    "conflict",
  );
});

void test("shared order resolution retains additions and never reintroduces removals", () => {
  const added = resolve(["a", "b", "c"], ["b", "a", "c"], ["a", "b", "remote", "c"]);
  assert.equal(added.status, "resolved");
  if (added.status === "resolved") assert.equal(added.order.includes("remote"), true);

  const removed = resolve(["a", "b", "c"], ["b", "a", "c"], ["a", "c"]);
  assert.equal(removed.status, "resolved");
  if (removed.status === "resolved") assert.deepEqual(removed.order, ["a", "c"]);
});

void test("shared order resolution is deterministic and rejects invalid local sets", () => {
  const current = ["a", "b", "c", "remote-a", "remote-b"];
  const outputs = Array.from({ length: 5 }, () =>
    resolve(["a", "b", "c"], ["b", "a", "c"], current),
  );
  assert.equal(outputs.every((result) => result.status === "resolved"), true);
  const first = outputs[0];
  if (first?.status === "resolved") {
    for (const result of outputs) {
      if (result.status === "resolved") assert.deepEqual(result.order, first.order);
    }
  }
  assert.equal(resolve(["a", "b"], ["a", "a"], ["a", "b"]).status, "conflict");
});
