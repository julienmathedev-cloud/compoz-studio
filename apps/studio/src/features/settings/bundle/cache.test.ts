/**
 * @file apps/studio/src/features/settings/bundle/cache.test.ts
 * @layer studio/features/settings/bundle
 * @description Unit tests for revisioned Studio settings bundle cache behavior.
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
import {
  isSettingsBundle,
  patchSettingsBundleCache,
} from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

const WEBSITE_ID = "website-1";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function createSettingsBundle(): SiteSettingsWithRevisionsDTO {
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

void test("recognizes only complete revisioned settings bundles", () => {
  const bundle = createSettingsBundle();

  assert.equal(isSettingsBundle(bundle), true);
  assert.equal(
    isSettingsBundle({
      settings: [],
      revisions: [],
    }),
    false,
  );
  assert.equal(
    isSettingsBundle({
      settings: {},
      revisions: {},
    }),
    false,
  );
  assert.equal(
    isSettingsBundle({
      settings: bundle.settings,
      revisions: {
        ...bundle.revisions,
        footerRevision: -1,
      },
    }),
    false,
  );
});

void test("caches the complete settings bundle, including all revisions", async () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;

    return new Response(JSON.stringify(bundle), {
      headers: {
        "content-type": "application/json",
      },
    });
  };

  try {
    const first = await getSettingsBundle(
      queryClient,
      WEBSITE_ID,
      DEFAULT_CONTENT_STATE,
    );
    const second = await getSettingsBundle(
      queryClient,
      WEBSITE_ID,
      DEFAULT_CONTENT_STATE,
    );

    assert.deepEqual(first, bundle);
    assert.deepEqual(second, bundle);
    assert.equal(fetchCount, 1);
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

void test("replaces a legacy cached projection with the canonical fetched bundle", async () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;

  queryClient.setQueryData(key, bundle.settings);

  globalThis.fetch = async () => {
    fetchCount += 1;

    return new Response(JSON.stringify(bundle), {
      headers: {
        "content-type": "application/json",
      },
    });
  };

  try {
    const result = await getSettingsBundle(
      queryClient,
      WEBSITE_ID,
      DEFAULT_CONTENT_STATE,
    );

    assert.deepEqual(result, bundle);
    assert.equal(fetchCount, 1);
    assert.deepEqual(
      queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key),
      bundle,
    );
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("rejects a network response without revision metadata", async () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        settings: bundle.settings,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

  try {
    await assert.rejects(
      () => getSettingsBundle(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE),
      /settings-bundle: invalid dto\.settings or dto\.revisions/,
    );

    assert.equal(queryClient.getQueryData(key), undefined);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("patches one section while retaining every other section and revision", () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const nextFooter = {
    ...DEFAULT_FOOTER_SETTINGS,
    copyright: "Compoz Studio",
  };

  queryClient.setQueryData(key, bundle);

  patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
    settings: {
      footer: nextFooter,
    },
  });

  const cached = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key);

  assert.ok(cached);
  assert.deepEqual(cached.settings.footer, nextFooter);
  assert.equal(cached.settings.header, bundle.settings.header);
  assert.equal(cached.settings.primaryMenu, bundle.settings.primaryMenu);
  assert.equal(cached.settings.legalMenu, bundle.settings.legalMenu);
  assert.equal(cached.settings.social, bundle.settings.social);
  assert.equal(cached.settings.identity, bundle.settings.identity);
  assert.equal(cached.settings.seo, bundle.settings.seo);
  assert.equal(cached.settings.theme, bundle.settings.theme);
  assert.deepEqual(cached.revisions, bundle.revisions);

  queryClient.clear();
});

void test("patches one revision while retaining every other revision", () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);

  queryClient.setQueryData(key, bundle);

  patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
    settings: {},
    revisions: {
      footerRevision: 3,
    },
  });

  const cached = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key);

  assert.ok(cached);
  assert.deepEqual(cached.settings, bundle.settings);
  assert.deepEqual(cached.revisions, {
    ...bundle.revisions,
    footerRevision: 3,
  });

  queryClient.clear();
});

void test("patches footer settings and its revision in one cache update", () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const nextFooter = {
    ...DEFAULT_FOOTER_SETTINGS,
    copyright: "Atomic footer",
  };

  queryClient.setQueryData(key, bundle);

  patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
    settings: { footer: nextFooter },
    revisions: { footerRevision: 9 },
  });

  const cached = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key);

  assert.ok(cached);
  assert.deepEqual(cached.settings.footer, nextFooter);
  assert.equal(cached.revisions.footerRevision, 9);
  assert.equal(cached.settings.header, bundle.settings.header);
  assert.equal(cached.revisions.headerRevision, bundle.revisions.headerRevision);

  queryClient.clear();
});

void test("does not patch a legacy cached settings projection", () => {
  const queryClient = createQueryClient();
  const bundle = createSettingsBundle();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const legacyProjection = bundle.settings;

  queryClient.setQueryData(key, legacyProjection);

  patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
    settings: {
      footer: {
        ...DEFAULT_FOOTER_SETTINGS,
        copyright: "Compoz Studio",
      },
    },
  });

  assert.equal(queryClient.getQueryData(key), legacyProjection);

  queryClient.clear();
});

void test("does not create a settings bundle when no cached projection exists", () => {
  const queryClient = createQueryClient();
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);

  patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
    settings: {
      footer: DEFAULT_FOOTER_SETTINGS,
    },
  });

  assert.equal(queryClient.getQueryData(key), undefined);

  queryClient.clear();
});
