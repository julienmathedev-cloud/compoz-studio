/**
 * @file packages/core/src/domain/revisions/json-value-equality.test.ts
 * @layer core/domain/revisions
 * @description Unit tests for structural equality of JSON-like values.
 * @remarks Object key order is ignored while array order and property presence remain significant.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";

void test("compares JSON-like values structurally", () => {
  const cases: ReadonlyArray<Readonly<{
    name: string;
    left: unknown;
    right: unknown;
    expected: boolean;
  }>> = [
    { name: "identical primitives", left: "value", right: "value", expected: true },
    { name: "different primitives", left: 1, right: 2, expected: false },
    { name: "null and an object", left: null, right: {}, expected: false },
    { name: "identical arrays", left: ["a", { id: 1 }], right: ["a", { id: 1 }], expected: true },
    { name: "arrays with different lengths", left: [1], right: [1, 2], expected: false },
    { name: "arrays with different order", left: [1, 2], right: [2, 1], expected: false },
    { name: "objects with different key order", left: { a: 1, b: 2 }, right: { b: 2, a: 1 }, expected: true },
    { name: "objects with different keys", left: { a: 1 }, right: { b: 1 }, expected: false },
    { name: "nested objects", left: { a: { b: [1, 2] } }, right: { a: { b: [1, 2] } }, expected: true },
    { name: "absent and explicit undefined properties", left: {}, right: { value: undefined }, expected: false },
    { name: "explicit undefined properties", left: { value: undefined }, right: { value: undefined }, expected: true },
    { name: "different nested values", left: { a: { b: 1 } }, right: { a: { b: 2 } }, expected: false },
  ];

  for (const { name, left, right, expected } of cases) {
    assert.equal(equalJsonValue(left, right), expected, name);
  }
});
