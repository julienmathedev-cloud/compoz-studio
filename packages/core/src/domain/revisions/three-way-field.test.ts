/**
 * @file packages/core/src/domain/revisions/three-way-field.test.ts
 * @layer core/domain/revisions
 * @description Unit tests for atomic three-way revision comparisons.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { compareThreeWayField } from "@compoz/core/domain/revisions/three-way-field";

void test("classifies unchanged fields", () => {
  const result = compareThreeWayField({
    path: "copyright",
    baseline: "Compoz",
    current: "Compoz",
    local: "Compoz",
  });

  assert.equal(result.classification, "unchanged");
});

void test("classifies local-only fields", () => {
  const result = compareThreeWayField({
    path: "copyright",
    baseline: "Compoz",
    current: "Compoz",
    local: "Compoz Studio",
  });

  assert.equal(result.classification, "local-only");
});

void test("classifies server-only fields", () => {
  const result = compareThreeWayField({
    path: "copyright",
    baseline: "Compoz",
    current: "Compoz CMS",
    local: "Compoz",
  });

  assert.equal(result.classification, "server-only");
});

void test("classifies matching concurrent changes", () => {
  const result = compareThreeWayField({
    path: "copyright",
    baseline: "Compoz",
    current: "Compoz Studio",
    local: "Compoz Studio",
  });

  assert.equal(result.classification, "same-change");
});

void test("classifies divergent concurrent changes as conflicts", () => {
  const result = compareThreeWayField({
    path: "copyright",
    baseline: "Compoz",
    current: "Compoz CMS",
    local: "Compoz Studio",
  });

  assert.equal(result.classification, "conflict");
  assert.equal(result.path, "copyright");
});

void test("uses an injected business equality function", () => {
  const result = compareThreeWayField({
    path: "siteName",
    baseline: "Compoz",
    current: "compoz",
    local: "COMPOZ",
    equals: (left, right) => left.toLowerCase() === right.toLowerCase(),
  });

  assert.equal(result.classification, "unchanged");
});
