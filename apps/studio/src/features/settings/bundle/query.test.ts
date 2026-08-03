/**
 * @file apps/studio/src/features/settings/bundle/query.test.ts
 * @layer studio/features/settings/bundle
 * @description Tests the canonical React Query settings-bundle definition.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { fetchFreshSettingsBundle } from "@compoz/studio/features/settings/bundle/fetchFreshSettingsBundle";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
import {
  selectSettingsBundleSettings,
  settingsBundleQueryOptions,
} from "@compoz/studio/features/settings/bundle/query";
import { UiError } from "@compoz/studio/lib/ui/uiError";

const WEBSITE_ID = "website-1";

function createBundle(): SiteSettingsWithRevisionsDTO {
  return {
    settings: {
      header: DEFAULT_HEADER_SETTINGS,
      footer: DEFAULT_FOOTER_SETTINGS,
      primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
      legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
      social: DEFAULT_SOCIAL_SETTINGS,
      identity: DEFAULT_IDENTITY_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
      theme: DEFAULT_THEME_SETTINGS,
    },
    revisions: {
      headerRevision: 1,
      footerRevision: 2,
      primaryMenuRevision: 3,
      legalMenuRevision: 4,
      socialRevision: 5,
      identityRevision: 6,
      seoRevision: 7,
      themeRevision: 8,
    },
  };
}

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

void test("rejects an invalid settings bundle with a UI error token", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({}), {
    headers: { "content-type": "application/json" },
  });

  try {
    await assert.rejects(
      fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE),
      (error: unknown) =>
        error instanceof Error && error.message === UiError.settingsBundleInvalid,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("canonical options cache the complete bundle while select exposes settings", async () => {
  const queryClient = createQueryClient();
  const bundle = createBundle();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(bundle), {
    headers: { "content-type": "application/json" },
  });

  try {
    const result = await queryClient.fetchQuery(
      settingsBundleQueryOptions(WEBSITE_ID, DEFAULT_CONTENT_STATE),
    );
    const cached = queryClient.getQueryData(
      settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE),
    );

    assert.deepEqual(result, bundle);
    assert.deepEqual(selectSettingsBundleSettings(result), bundle.settings);
    assert.deepEqual(cached, bundle);
    assert.ok(cached && typeof cached === "object" && "settings" in cached);
    assert.ok(cached && typeof cached === "object" && "revisions" in cached);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("get and hook-equivalent canonical reads deduplicate concurrent network work", async () => {
  const queryClient = createQueryClient();
  const bundle = createBundle();
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify(bundle), {
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const [fromGet, fromHook] = await Promise.all([
      getSettingsBundle(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE),
      queryClient.fetchQuery(
        settingsBundleQueryOptions(WEBSITE_ID, DEFAULT_CONTENT_STATE),
      ),
    ]);

    assert.equal(fetchCount, 1);
    assert.deepEqual(fromGet, bundle);
    assert.deepEqual(fromHook, bundle);
    assert.deepEqual(
      queryClient.getQueryData(
        settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE),
      ),
      bundle,
    );
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("canonical hook-originated cache reads retain the bundle shape through section patches", async () => {
  const queryClient = createQueryClient();
  const bundle = createBundle();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(bundle), {
    headers: { "content-type": "application/json" },
  });

  try {
    await queryClient.fetchQuery(
      settingsBundleQueryOptions(WEBSITE_ID, DEFAULT_CONTENT_STATE),
    );
    const footer = { ...bundle.settings.footer, copyright: "Updated footer" };
    patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
      settings: { footer },
      revisions: { footerRevision: 12 },
    });

    const cached = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(
      settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE),
    );
    assert.ok(cached);
    assert.deepEqual(cached.settings.footer, footer);
    assert.equal(cached.revisions.footerRevision, 12);
    assert.deepEqual(cached.settings.header, bundle.settings.header);
    assert.equal(cached.revisions.headerRevision, bundle.revisions.headerRevision);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});
