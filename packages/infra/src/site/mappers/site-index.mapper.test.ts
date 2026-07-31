/**
 * @file packages/infra/src/site/mappers/site-index.mapper.test.ts
 * @layer infra/site
 * @description Tests deterministic Page-row to SiteIndex projection mapping.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import {
  toDomainDraftSiteIndex,
  toDomainSiteIndex,
} from "@compoz/infra/site/mappers/site-index.mapper";

const FIRST_UPDATED_AT = new Date("2026-07-29T09:00:00.000Z");
const LATEST_UPDATED_AT = new Date("2026-07-29T10:00:00.000Z");

void test("maps empty Draft and Published indexes to a stable empty projection", () => {
  const draft = toDomainSiteIndex([], CONTENT_STATE.DRAFT);
  const published = toDomainSiteIndex([], CONTENT_STATE.PUBLISHED);

  assert.deepEqual(draft, { pages: [], updatedAt: "" });
  assert.deepEqual(published, { pages: [], updatedAt: "" });
  assert.deepEqual(toDomainSiteIndex([], CONTENT_STATE.DRAFT), draft);
  assert.deepEqual(toDomainDraftSiteIndex([]), draft);
});

void test("preserves Page-row order and uses the maximum updatedAt", () => {
  const index = toDomainSiteIndex(
    [
      {
        pageId: "second",
        slug: "second",
        name: "Second",
        parentPageId: null,
        updatedAt: FIRST_UPDATED_AT,
      },
      {
        pageId: "first",
        slug: "first",
        name: "First",
        parentPageId: "parent",
        updatedAt: LATEST_UPDATED_AT,
      },
    ],
    CONTENT_STATE.DRAFT,
  );

  assert.deepEqual(index.pages.map((page) => page.id), ["second", "first"]);
  assert.equal(index.updatedAt, LATEST_UPDATED_AT.toISOString());
});

void test("keeps metadata revisions in the Draft projection", () => {
  const index = toDomainDraftSiteIndex([
    {
      pageId: "page-a",
      slug: "page-a",
      name: "Page A",
      parentPageId: null,
      metaRevision: 7,
      updatedAt: LATEST_UPDATED_AT,
    },
  ]);

  assert.equal(index.pages[0]?.metaRevision, 7);
  assert.equal(index.updatedAt, LATEST_UPDATED_AT.toISOString());
});
