/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests metadata presentation, decisions, and mergeable differences.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { resolvePageMetadataChanges } from "@compoz/core/domain/pages/revisions/page-metadata";
import { toDecisionConflictGroups } from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  createPageMetadataConflictState,
  resolvePageMetadataConflictValues,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { toPageMetadataConflictPresentation } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const baseline: PageFormValues = {
  name: "Initial",
  slug: "initial",
  seoTitle: null,
  seoDescription: null,
  parentId: null,
  sitemap: null,
  paginationEnabled: false,
};
const local: PageFormValues = {
  ...baseline,
  name: "Local",
  sitemap: { include: false, changefreq: "monthly", priority: null },
};
const state = createPageMetadataConflictState({
  expectedMetaRevision: 1,
  currentMetaRevision: 2,
  conflicts: [{ field: "name", baseline: "Initial", current: "Remote", local: "Local" }],
  current: {
    page: {
      id: "page",
      parentId: null,
      slug: "initial",
      name: "Remote",
      seoTitle: null,
      seoDescription: null,
      blocks: [],
      sitemap: null,
      paginationEnabled: true,
      meta: { createdAt: "2026-01-01", updatedAt: "2026-01-02" },
    },
    revisions: { metaRevision: 2, blocksRevision: 4 },
  },
}, baseline, local);

const t = (key: string, values?: Record<string, string | number>) => {
  if (key === "sitemap.frequency") return `Frequency: ${values?.value}`;
  if (key === "sitemap.priority") return `Priority: ${values?.value}`;
  return key;
};

void test("presents real and mergeable changes with only server/local choices", () => {
  const groups = toPageMetadataConflictPresentation(
    state,
    t,
    (key) => ({ monthly: "Monthly" })[key] ?? key,
  );
  const items = groups[0]?.items ?? [];

  assert.deepEqual(items.map((item) => [item.id, item.status, item.resolutionMode]), [
    ["name", "conflict", "choice"],
    ["sitemap", "local-only", "automatic"],
    ["paginationEnabled", "server-only", "automatic"],
  ]);
  assert.equal(items[0]?.choice, undefined);
  assert.equal(items[1]?.comparison?.local.kind, "list");
  assert.equal(items[2]?.comparison?.server.kind, "boolean");
});

void test("hides a local-only SEO description while preserving it in the resolved metadata", () => {
  const mixed = createPageMetadataConflictState(
    {
      ...state.details,
      current: {
        ...state.details.current,
        page: {
          ...state.details.current.page,
          name: "Remote",
          seoDescription: null,
          paginationEnabled: false,
        },
      },
    },
    baseline,
    { ...baseline, name: "Local", seoDescription: "Local description" },
  );
  const groups = toDecisionConflictGroups(
    toPageMetadataConflictPresentation(mixed, t, (key) => key),
  );

  assert.deepEqual(groups[0]?.items.map((item) => item.id), ["name"]);
  const resolution = resolvePageMetadataConflictValues({
    state: mixed,
    choices: { name: "server" },
    localParentId: null,
  });
  assert.equal(resolution.status, "resolved");
  if (resolution.status === "resolved") {
    assert.equal(resolution.values.name, "Remote");
    assert.equal(resolution.values.seoDescription, "Local description");
  }
});

void test("hides a server-only SEO description beside two decisions and adopts its saved value", () => {
  const mixed = createPageMetadataConflictState(
    {
      ...state.details,
      conflicts: [
        { field: "name", baseline: "Initial", current: "Remote", local: "Local" },
        { field: "slug", baseline: "initial", current: "remote", local: "local" },
      ],
      current: {
        ...state.details.current,
        page: {
          ...state.details.current.page,
          name: "Remote",
          slug: "remote",
          seoDescription: "Saved description",
          paginationEnabled: false,
        },
      },
    },
    baseline,
    { ...baseline, name: "Local", slug: "local" },
  );
  const groups = toDecisionConflictGroups(
    toPageMetadataConflictPresentation(mixed, t, (key) => key),
  );

  assert.deepEqual(groups[0]?.items.map((item) => item.id), ["name", "slug"]);
  const resolution = resolvePageMetadataConflictValues({
    state: mixed,
    choices: { name: "local", slug: "server" },
    localParentId: null,
  });
  assert.equal(resolution.status, "resolved");
  if (resolution.status === "resolved") {
    assert.equal(resolution.values.name, "Local");
    assert.equal(resolution.values.slug, "remote");
    assert.equal(resolution.values.seoDescription, "Saved description");
  }
});

void test("hides a local-only SEO title between two decisions and keeps its local value", () => {
  const mixed = createPageMetadataConflictState(
    {
      ...state.details,
      conflicts: [
        { field: "name", baseline: "Initial", current: "Remote", local: "Local" },
        { field: "seoDescription", baseline: null, current: "Saved", local: "Local" },
      ],
      current: {
        ...state.details.current,
        page: {
          ...state.details.current.page,
          name: "Remote",
          seoDescription: "Saved",
          paginationEnabled: false,
        },
      },
    },
    baseline,
    {
      ...baseline,
      name: "Local",
      seoTitle: "Local title",
      seoDescription: "Local",
    },
  );
  const groups = toDecisionConflictGroups(
    toPageMetadataConflictPresentation(mixed, t, (key) => key),
  );

  assert.deepEqual(groups[0]?.items.map((item) => item.id), ["name", "seoDescription"]);
  const resolution = resolvePageMetadataConflictValues({
    state: mixed,
    choices: { name: "server", seoDescription: "local" },
    localParentId: null,
  });
  assert.equal(resolution.status, "resolved");
  if (resolution.status === "resolved") {
    assert.equal(resolution.values.seoTitle, "Local title");
  }
});

void test("all-automatic metadata is resolved upstream without creating a conflict panel state", () => {
  const result = resolvePageMetadataChanges({
    current: {
      ...state.details.current.page,
      name: "Saved name",
    },
    effectiveParentId: null,
    changes: {
      name: { baseline: "Initial", local: "Initial" },
      seoDescription: { baseline: null, local: "Local description" },
    },
  });

  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.patch, { seoDescription: "Local description" });
});
