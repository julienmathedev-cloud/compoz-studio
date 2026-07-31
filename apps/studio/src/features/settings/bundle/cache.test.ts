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
import { fetchFreshSettingsBundle } from "@compoz/studio/features/settings/bundle/fetchFreshSettingsBundle";
import { fetchFreshSettingsSection } from "@compoz/studio/features/settings/conflicts/fetch-fresh-settings-section";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
import { settingsBundleQueryOptions } from "@compoz/studio/features/settings/bundle/query";

const WEBSITE_ID = "website-1";

const NEXT_PRIMARY_MENU_SETTINGS = {
  items: [
    {
      id: "primary-test",
      label: "Primary test",
      href: "/primary-test",
      newTab: false,
      children: [],
    },
  ],
};

const NEXT_LEGAL_MENU_SETTINGS = {
  items: [
    {
      id: "legal-test",
      label: "Legal test",
      href: "/legal-test",
      newTab: false,
    },
  ],
};

const NEXT_SOCIAL_SETTINGS = {
  items: [
    {
      id: "social-test",
      kind: "website",
      href: "https://example.com/social-test",
    },
  ],
};

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

void test("reads a fresh bundle without consulting or mutating the React Query cache", async () => {
  const queryClient = createQueryClient();
  const cached = createSettingsBundle();
  const fresh = { ...createSettingsBundle(), revisions: { ...createSettingsBundle().revisions, identityRevision: 9 } };
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const originalFetch = globalThis.fetch;
  queryClient.setQueryData(key, cached);
  globalThis.fetch = async () => new Response(JSON.stringify(fresh), { headers: { "content-type": "application/json" } });

  try {
    const result = await fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE);
    assert.equal(result.revisions.identityRevision, 9);
    assert.deepEqual(queryClient.getQueryData(key), cached);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("defers fresh section cache adoption until the user explicitly decides", async () => {
  const queryClient = createQueryClient();
  const cached = createSettingsBundle();
  const fresh = { ...createSettingsBundle(), settings: { ...createSettingsBundle().settings, footer: { copyright: "Fresh", showYear: false } }, revisions: { ...createSettingsBundle().revisions, footerRevision: 12 } };
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const originalFetch = globalThis.fetch;
  queryClient.setQueryData(key, cached);
  globalThis.fetch = async () => new Response(JSON.stringify(fresh), { headers: { "content-type": "application/json" } });
  try {
    const section = await fetchFreshSettingsSection({
      signal: new AbortController().signal,
      queryClient,
      websiteId: WEBSITE_ID,
      sectionKey: "footer",
      revisionKey: "footerRevision",
      toFormValues: (value) => value,
    });
    assert.deepEqual(queryClient.getQueryData(key), cached);
    section.adoptCache();
    assert.deepEqual((queryClient.getQueryData(key) as SiteSettingsWithRevisionsDTO).settings.footer, fresh.settings.footer);
    assert.equal((queryClient.getQueryData(key) as SiteSettingsWithRevisionsDTO).revisions.footerRevision, 12);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("adopts an authoritative conflict section into a canonical hook-originated bundle", async () => {
  const queryClient = createQueryClient();
  const cached = createSettingsBundle();
  const fresh = {
    ...createSettingsBundle(),
    settings: {
      ...createSettingsBundle().settings,
      footer: { copyright: "Authoritative", showYear: false },
    },
    revisions: { ...createSettingsBundle().revisions, footerRevision: 12 },
  };
  const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
  const originalFetch = globalThis.fetch;
  let response = cached;
  globalThis.fetch = async () => new Response(JSON.stringify(response), {
    headers: { "content-type": "application/json" },
  });

  try {
    await queryClient.fetchQuery(
      settingsBundleQueryOptions(WEBSITE_ID, DEFAULT_CONTENT_STATE),
    );
    response = fresh;
    const section = await fetchFreshSettingsSection({
      signal: new AbortController().signal,
      queryClient,
      websiteId: WEBSITE_ID,
      sectionKey: "footer",
      revisionKey: "footerRevision",
      toFormValues: (value) => value,
    });
    section.adoptCache();

    const adopted = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key);
    assert.ok(adopted);
    assert.equal(isSettingsBundle(adopted), true);
    assert.deepEqual(adopted.settings.footer, fresh.settings.footer);
    assert.equal(adopted.revisions.footerRevision, fresh.revisions.footerRevision);
    assert.deepEqual(adopted.settings.header, cached.settings.header);
    assert.equal(adopted.revisions.headerRevision, cached.revisions.headerRevision);
  } finally {
    globalThis.fetch = originalFetch;
    queryClient.clear();
  }
});

void test("fresh bundle read propagates non-OK HTTP responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "UNKNOWN" } }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
  try {
    await assert.rejects(fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE), (error: unknown) => {
      return typeof error === "object" && error !== null && "status" in error && error.status === 500;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("fresh bundle read rejects invalid JSON and incomplete payloads", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("{invalid", { headers: { "content-type": "application/json" } });
    await assert.rejects(fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE), /settingsStudioApi\.bundle\.get/u);

    globalThis.fetch = async () => new Response(JSON.stringify({ settings: createSettingsBundle().settings }), { headers: { "content-type": "application/json" } });
    await assert.rejects(fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE), /invalid dto\.settings or dto\.revisions/u);

    const bundle = createSettingsBundle();
    globalThis.fetch = async () => new Response(JSON.stringify({ ...bundle, settings: { ...bundle.settings, identity: undefined } }), { headers: { "content-type": "application/json" } });
    await assert.rejects(fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE), /invalid dto\.settings or dto\.revisions/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("fresh bundle read propagates network and abort failures", async () => {
  const originalFetch = globalThis.fetch;
  const networkFailure = new TypeError("network unavailable");
  try {
    globalThis.fetch = async () => { throw networkFailure; };
    await assert.rejects(fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE), networkFailure);

    const controller = new AbortController();
    globalThis.fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
    const pending = fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE, controller.signal);
    controller.abort();
    await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

void test("patches each settings-section and revision pair without touching the other pairs", () => {
  const cases = [
    [
      "footer",
      "footerRevision",
      { ...DEFAULT_FOOTER_SETTINGS, copyright: "Footer" },
    ],
    ["header", "headerRevision", { ...DEFAULT_HEADER_SETTINGS, blur: true }],
    [
      "identity",
      "identityRevision",
      { ...DEFAULT_IDENTITY_SETTINGS, siteName: "Identity" },
    ],
    ["primaryMenu", "primaryMenuRevision", NEXT_PRIMARY_MENU_SETTINGS],
    ["legalMenu", "legalMenuRevision", NEXT_LEGAL_MENU_SETTINGS],
    ["social", "socialRevision", NEXT_SOCIAL_SETTINGS],
    ["seo", "seoRevision", { ...DEFAULT_SEO_SETTINGS, defaultTitle: "SEO" }],
    ["theme", "themeRevision", { ...DEFAULT_THEME_SETTINGS, mode: "dark" }],
  ] as const;

  for (const [section, revision, settings] of cases) {
    const queryClient = createQueryClient();
    const bundle = createSettingsBundle();
    const key = settingsBundleKey(WEBSITE_ID, DEFAULT_CONTENT_STATE);
    const nextRevision = bundle.revisions[revision] + 10;

    queryClient.setQueryData(key, bundle);
    assert.notDeepEqual(bundle.settings[section], settings);

    patchSettingsBundleCache(queryClient, WEBSITE_ID, DEFAULT_CONTENT_STATE, {
      settings: { [section]: settings },
      revisions: { [revision]: nextRevision },
    });

    const cached = queryClient.getQueryData<SiteSettingsWithRevisionsDTO>(key);
    assert.ok(cached);
    assert.deepEqual(cached.settings[section], settings);
    assert.equal(cached.revisions[revision], nextRevision);

    for (const otherSection of Object.keys(bundle.settings) as Array<
      keyof SiteSettingsWithRevisionsDTO["settings"]
    >) {
      if (otherSection !== section) {
        assert.equal(cached.settings[otherSection], bundle.settings[otherSection]);
      }
    }
    for (const otherRevision of Object.keys(bundle.revisions) as Array<
      keyof SiteSettingsWithRevisionsDTO["revisions"]
    >) {
      if (otherRevision !== revision) {
        assert.equal(
          cached.revisions[otherRevision],
          bundle.revisions[otherRevision],
        );
      }
    }

    queryClient.clear();
  }
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
