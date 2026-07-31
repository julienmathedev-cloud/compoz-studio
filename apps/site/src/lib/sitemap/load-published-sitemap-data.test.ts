/**
 * @file apps/site/src/lib/sitemap/load-published-sitemap-data.test.ts
 * @layer site/lib/sitemap
 * @description Tests the targeted published sitemap data loader.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageSitemapMetadata } from "@compoz/core/domain/pages/ports/pages-repository";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { loadPublishedSitemapData } from "@compoz/site/lib/sitemap/load-published-sitemap-data";

const SETTINGS = {
  header: DEFAULT_HEADER_SETTINGS,
  footer: DEFAULT_FOOTER_SETTINGS,
  identity: DEFAULT_IDENTITY_SETTINGS,
  primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
  legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
  social: DEFAULT_SOCIAL_SETTINGS,
  seo: DEFAULT_SEO_SETTINGS,
  theme: DEFAULT_THEME_SETTINGS,
};

const REF_A = { id: "page-a", slug: "a", name: "A", parentId: null };
const REF_B = { id: "page-b", slug: "b", name: "B", parentId: null };

function metadata(id: string): PageSitemapMetadata {
  return {
    id,
    sitemap: { include: true, changefreq: "weekly", priority: 0.7 },
    metaUpdatedAt: "2026-07-29T10:00:00.000Z",
  };
}

function repositories(options?: {
  refs?: ReadonlyArray<typeof REF_A> | ReadonlyArray<typeof REF_B> | ReadonlyArray<typeof REF_A | typeof REF_B>;
  metadata?: ReadonlyArray<PageSitemapMetadata | null>;
}) {
  const calls = { readIndex: 0, readSettings: 0, readMetadata: 0 };
  const refs = options?.refs ?? [];

  return {
    calls,
    pagesRepository: {
      readManySitemapMetadataById: async (
        state: string,
        ids: ReadonlyArray<string>,
      ) => {
        calls.readMetadata += 1;
        assert.equal(state, CONTENT_STATE.PUBLISHED);
        assert.deepEqual(ids, refs.map((ref) => ref.id));
        return [...(options?.metadata ?? [])];
      },
    },
    siteRepository: {
      readIndex: async (state: string) => {
        calls.readIndex += 1;
        assert.equal(state, CONTENT_STATE.PUBLISHED);
        return { pages: refs, updatedAt: "" };
      },
      readSettings: async (state: string) => {
        calls.readSettings += 1;
        assert.equal(state, CONTENT_STATE.PUBLISHED);
        return SETTINGS;
      },
    },
  };
}

void test("loads empty sitemap data without Page reads or provisioning", async () => {
  const repositoriesForTest = repositories();

  const result = await loadPublishedSitemapData({
    ...repositoriesForTest,
  });

  assert.deepEqual(result.pages, []);
  assert.deepEqual(repositoriesForTest.calls, {
    readIndex: 1,
    readSettings: 1,
    readMetadata: 1,
  });
});

void test("uses one batch read, preserves index order, and skips orphaned refs", async () => {
  const repositoriesForTest = repositories({
    refs: [REF_B, REF_A],
    metadata: [metadata(REF_B.id), null],
  });

  const result = await loadPublishedSitemapData({
    ...repositoriesForTest,
  });

  assert.deepEqual(result.pages, [{ ref: REF_B, metadata: metadata(REF_B.id) }]);
  assert.equal(repositoriesForTest.calls.readMetadata, 1);
});
