/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation.test.ts
 * @layer studio/features/pages/conflicts
 * @description Tests metadata conflict values are formatted without JSON or enum labels.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { PageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { toPageMetadataConflictPresentation } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation";

const state = {
  unresolvedFields: ["sitemap", "paginationEnabled"],
  details: {
    currentMetaRevision: 2,
    conflicts: [
      { field: "sitemap", baseline: null, current: { include: true, changefreq: "weekly", priority: 0.7 }, local: { include: false, changefreq: "monthly", priority: null } },
      { field: "paginationEnabled", baseline: false, current: true, local: false },
    ],
  },
} as unknown as PageMetadataConflictState;

const t = (key: string, values?: Record<string, string | number>) => {
  if (key === "sitemap.frequency") return `Frequency: ${values?.value}`;
  if (key === "sitemap.priority") return `Priority: ${values?.value}`;
  return key;
};

void test("uses translated sitemap frequency and readable booleans", () => {
  const french = toPageMetadataConflictPresentation(state, t, (key) => ({ weekly: "Hebdomadaire", monthly: "Mensuelle" })[key] ?? key);
  const english = toPageMetadataConflictPresentation(state, t, (key) => ({ weekly: "Weekly", monthly: "Monthly" })[key] ?? key);
  const frenchCurrent = french[0]?.items[0]?.comparison?.server;
  const englishCurrent = english[0]?.items[0]?.comparison?.server;
  assert.deepEqual(frenchCurrent, { kind: "list", items: ["sitemap.included", "Frequency: Hebdomadaire", "Priority: 0.7"] });
  assert.deepEqual(englishCurrent, { kind: "list", items: ["sitemap.included", "Frequency: Weekly", "Priority: 0.7"] });
  assert.equal(french[0]?.items[1]?.comparison?.server.kind, "boolean");
});
