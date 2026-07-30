/**
 * @file apps/studio/src/features/pages/mappers/pages-form.test.ts
 * @layer studio/features/pages/mappers
 * @description Tests targeted page OCC payload construction.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  toPageFormValuesFromDraftSources,
  toUpdatePageIntentDTOFromFormValues,
} from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const BASELINE: PageFormValues = {
  name: "Page",
  slug: "page",
  seoTitle: null,
  seoDescription: null,
  parentId: null,
  sitemap: { include: true, changefreq: "weekly", priority: 0.7 },
  paginationEnabled: false,
};

void test("emits only canonically changed metadata fields with baseline and local", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: BASELINE,
    local: {
      ...BASELINE,
      name: " Renamed ",
      seoTitle: " ",
    },
    expectedMetaRevision: 7,
  });

  assert.deepEqual(payload, {
    metadataChanges: {
      expectedMetaRevision: 7,
      changes: {
        name: { baseline: "Page", local: "Renamed" },
      },
    },
  });
});

void test("structurally equal sitemap and reverted dirty values are omitted", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: BASELINE,
    local: {
      ...BASELINE,
      name: " Page ",
      sitemap: { priority: 0.7, include: true, changefreq: "weekly" },
    },
    expectedMetaRevision: 7,
    dirtyFields: { name: true, sitemap: true },
  });

  assert.deepEqual(payload, {});
});

void test("parent intent remains separate and carries only structure OCC", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: BASELINE,
    local: { ...BASELINE, parentId: "parent" },
    expectedMetaRevision: 7,
    expectedDraftStructureRevision: 11,
  });

  assert.deepEqual(payload, {
    parentChange: {
      baseline: null,
      local: "parent",
      expectedDraftStructureRevision: 11,
    },
  });
});

void test("dirtyFields cannot hide a real OCC divergence after conflict resolution", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: { ...BASELINE, name: "Remote" },
    local: { ...BASELINE, name: "Initial" },
    expectedMetaRevision: 8,
    dirtyFields: { name: false },
  });

  assert.deepEqual(payload, {
    metadataChanges: {
      expectedMetaRevision: 8,
      changes: {
        name: { baseline: "Remote", local: "Initial" },
      },
    },
  });
});

void test("normalization removes empty nullable text and structural sitemap noise", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: {
      ...BASELINE,
      seoTitle: null,
      seoDescription: "",
      sitemap: {
        include: true,
        priority: 0.7,
        changefreq: "weekly",
      },
    },
    local: {
      ...BASELINE,
      seoTitle: " ",
      seoDescription: null,
      sitemap: {
        changefreq: "weekly",
        include: true,
        priority: 0.7,
      },
    },
    expectedMetaRevision: 8,
    dirtyFields: {
      seoTitle: false,
      seoDescription: false,
      sitemap: false,
    },
  });

  assert.deepEqual(payload, {});
});

void test("parent divergence is emitted even when RHF no longer marks it dirty", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: { ...BASELINE, parentId: "remote-parent" },
    local: { ...BASELINE, parentId: "initial-parent" },
    expectedMetaRevision: 8,
    expectedDraftStructureRevision: 12,
    dirtyFields: { parentId: false },
  });

  assert.deepEqual(payload, {
    parentChange: {
      baseline: "remote-parent",
      local: "initial-parent",
      expectedDraftStructureRevision: 12,
    },
  });
});

void test("payload is empty when every canonical value equals its OCC baseline", () => {
  const payload = toUpdatePageIntentDTOFromFormValues({
    baseline: BASELINE,
    local: {
      ...BASELINE,
      name: " Page ",
      seoTitle: "",
    },
    expectedMetaRevision: 8,
    dirtyFields: {
      name: false,
      slug: false,
      seoTitle: false,
      seoDescription: false,
      parentId: false,
      sitemap: false,
      paginationEnabled: false,
    },
  });

  assert.deepEqual(payload, {});
});

void test("form values use the current draft SiteIndex parent instead of the Page snapshot parent", () => {
  const values = toPageFormValuesFromDraftSources(
    {
      id: "page",
      parentId: "stale-parent",
      slug: "page",
      name: "Page",
      seoTitle: null,
      seoDescription: null,
      blocks: [],
      sitemap: null,
      paginationEnabled: false,
      meta: {
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
    },
    "current-parent",
  );

  assert.equal(values.parentId, "current-parent");
});
