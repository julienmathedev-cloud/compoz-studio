/**
 * @file apps/studio/src/features/settings/_shared/revisioned-draft-snapshot.test.ts
 * @layer studio/features/settings
 * @description Unit tests for the website-scoped revisioned draft snapshot lifecycle.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { createRevisionedDraftSnapshot } from "@compoz/studio/features/settings/_shared/revisioned-draft-snapshot";

type TestValues = {
  items: Array<{ label: string; nested: { value: string | undefined } }>;
  metadata: { optional: undefined; nullable: null };
};

function createValues(label = "initial"): TestValues {
  return {
    items: [{ label, nested: { value: undefined } }],
    metadata: { optional: undefined, nullable: null },
  };
}

function commitDraftLoad(
  snapshot: ReturnType<typeof createRevisionedDraftSnapshot<TestValues>>,
  websiteId: string,
  baseline: TestValues,
  revision = 1,
): TestValues {
  const loaded = snapshot.commitLoad(snapshot.beginLoad(), {
    websiteId,
    baseline,
    revision,
    writable: true,
    isWebsiteCurrent: () => true,
  });

  assert.ok(loaded);
  return loaded;
}

void test("isolates nested loaded form values while preserving undefined and null", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  const loaded = commitDraftLoad(snapshot, "website-a", createValues());

  loaded.items[0]!.nested.value = "edited";
  loaded.metadata.nullable = null;

  const save = snapshot.captureForSave("website-a");

  assert.ok(save);
  assert.equal(save.baseline.items[0]!.nested.value, undefined);
  assert.equal("optional" in save.baseline.metadata, true);
  assert.equal(save.baseline.metadata.optional, undefined);
  assert.equal(save.baseline.metadata.nullable, null);
});

void test("isolates values returned after a successful save", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  commitDraftLoad(snapshot, "website-a", createValues());
  const captured = snapshot.captureForSave("website-a");

  assert.ok(captured);

  const saved = snapshot.commitSave(captured, {
    websiteId: "website-a",
    baseline: createValues("server"),
    revision: 2,
    isWebsiteCurrent: () => true,
  });

  assert.ok(saved);
  saved.items[0]!.label = "mutated return value";

  const next = snapshot.captureForSave("website-a");
  assert.ok(next);
  assert.equal(next.baseline.items[0]!.label, "server");
});

void test("invalidates a writable draft immediately when a load begins", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  commitDraftLoad(snapshot, "website-a", createValues());

  snapshot.beginLoad();

  assert.equal(snapshot.captureForSave("website-a"), null);
});

void test("does not capture a snapshot for another website", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  commitDraftLoad(snapshot, "website-a", createValues());

  assert.equal(snapshot.captureForSave("website-b"), null);
});

void test("does not let an obsolete load replace the latest snapshot", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  const loadA = snapshot.beginLoad();
  const loadB = snapshot.beginLoad();

  const committedB = snapshot.commitLoad(loadB, {
    websiteId: "website-b",
    baseline: createValues("B"),
    revision: 2,
    writable: true,
    isWebsiteCurrent: () => true,
  });
  const committedA = snapshot.commitLoad(loadA, {
    websiteId: "website-a",
    baseline: createValues("A"),
    revision: 1,
    writable: true,
    isWebsiteCurrent: () => true,
  });

  assert.ok(committedB);
  assert.equal(committedA, null);
  assert.equal(snapshot.captureForSave("website-a"), null);
  assert.equal(snapshot.captureForSave("website-b")?.expectedRevision, 2);
});

void test("does not let an obsolete save replace a newer snapshot", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  commitDraftLoad(snapshot, "website-a", createValues("A"));
  const saveA = snapshot.captureForSave("website-a");

  assert.ok(saveA);

  commitDraftLoad(snapshot, "website-a", createValues("B"), 2);
  const committedA = snapshot.commitSave(saveA, {
    websiteId: "website-a",
    baseline: createValues("saved A"),
    revision: 3,
    isWebsiteCurrent: () => true,
  });

  assert.equal(committedA, null);
  assert.equal(snapshot.captureForSave("website-a")?.baseline.items[0]!.label, "B");
});

void test("never installs a writable snapshot from a published load", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  const loaded = snapshot.commitLoad(snapshot.beginLoad(), {
    websiteId: "website-a",
    baseline: createValues("published"),
    revision: 4,
    writable: false,
    isWebsiteCurrent: () => true,
  });

  assert.ok(loaded);
  assert.equal(snapshot.captureForSave("website-a"), null);
});

void test("commits the normalized server baseline, revision, and captured website", () => {
  const snapshot = createRevisionedDraftSnapshot<TestValues>();
  commitDraftLoad(snapshot, "website-a", createValues());
  const captured = snapshot.captureForSave("website-a");

  assert.ok(captured);

  const serverBaseline = createValues("normalized server value");
  const saved = snapshot.commitSave(captured, {
    websiteId: "website-a",
    baseline: serverBaseline,
    revision: 9,
    isWebsiteCurrent: () => true,
  });

  assert.deepEqual(saved, serverBaseline);
  const next = snapshot.captureForSave("website-a");
  assert.ok(next);
  assert.equal(next.expectedRevision, 9);
  assert.deepEqual(next.baseline, serverBaseline);
  assert.equal(snapshot.captureForSave("website-b"), null);
});
