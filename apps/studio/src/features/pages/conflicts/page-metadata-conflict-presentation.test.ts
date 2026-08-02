/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests metadata presentation, decisions, and mergeable differences.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { createPageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
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
    { name: "local" },
    t,
    (key) => ({ monthly: "Monthly" })[key] ?? key,
  );
  const items = groups[0]?.items ?? [];

  assert.deepEqual(items.map((item) => [item.id, item.status, item.resolutionMode]), [
    ["name", "conflict", "choice"],
    ["sitemap", "local-only", "automatic"],
    ["paginationEnabled", "server-only", "automatic"],
  ]);
  assert.equal(items[0]?.choice, "local");
  assert.equal(items[1]?.comparison?.local.kind, "list");
  assert.equal(items[2]?.comparison?.server.kind, "boolean");
});
