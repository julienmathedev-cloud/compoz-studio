/**
 * @file apps/studio/src/app/api/_adapters/update-settings-adapters.test.ts
 * @layer studio/app/api/adapters
 * @description Public adapter tests for revisioned settings update intents.
 * @remarks Baselines and patches remain separate across every adapter; composites are asserted at the adapter boundary without global mocks.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { adaptUpdateHeaderIntent } from "@compoz/studio/app/api/_adapters/header";
import { adaptUpdateIdentityIntent } from "@compoz/studio/app/api/_adapters/identity";
import {
  adaptUpdateLegalMenuIntent,
  adaptUpdatePrimaryMenuIntent,
} from "@compoz/studio/app/api/_adapters/menus";
import { adaptUpdateSeoIntent } from "@compoz/studio/app/api/_adapters/seo";
import { adaptUpdateSocialIntent } from "@compoz/studio/app/api/_adapters/social";
import { adaptUpdateThemeIntent } from "@compoz/studio/app/api/_adapters/theme";
import type { UpdateHeaderSettingsOCCIntentDTO } from "@compoz/validation/site/settings/header/header-intents";
import type { UpdateIdentitySettingsOCCIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";
import type { UpdateLegalMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";
import type { UpdatePrimaryMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";
import type { UpdateSeoSettingsOCCIntentDTO } from "@compoz/validation/site/settings/seo/seo-intents";
import type { UpdateSocialSettingsOCCIntentDTO } from "@compoz/validation/site/settings/social/social-intents";
import type { UpdateThemeSettingsOCCIntentDTO } from "@compoz/validation/site/settings/theme/theme-intents";

const PRIMARY_ITEMS = [
  {
    id: "work",
    label: " Work ",
    href: "/work",
    newTab: false,
    children: [
      {
        id: "detail",
        label: " Detail ",
        href: "/work/detail",
        newTab: false,
      },
    ],
  },
  {
    id: "about",
    label: " About ",
    href: "/about",
    newTab: false,
    children: [],
  },
];

const LEGAL_ITEMS = [
  { id: "legal", label: " Legal ", href: "/legal", newTab: false },
  { id: "privacy", label: " Privacy ", href: "/privacy", newTab: true },
];

const SOCIAL_ITEMS: Array<{
  id: string;
  kind: "website" | "github";
  href: string;
}> = [
  { id: "website", kind: "website", href: "https://example.com" },
  { id: "github", kind: "github", href: "https://github.com/example" },
];

void test("adapts a header patch without merging it into its baseline", () => {
  const intent: UpdateHeaderSettingsOCCIntentDTO = {
    baseline: DEFAULT_HEADER_SETTINGS,
    patch: { blur: true },
    expectedRevision: 3,
  };

  const result = adaptUpdateHeaderIntent(intent);

  assert.deepEqual(result.baseline, DEFAULT_HEADER_SETTINGS);
  assert.deepEqual(result.patch, { blur: true });
  assert.equal(result.expectedRevision, 3);
  assert.deepEqual(Object.keys(result.patch), ["blur"]);
});

void test("adapts identity baseline and patch independently without inventing optional fields", () => {
  const intent: UpdateIdentitySettingsOCCIntentDTO = {
    baseline: {
      ...DEFAULT_IDENTITY_SETTINGS,
      siteName: " Baseline site ",
      tagline: " Baseline tagline ",
      logo: {
        src: "https://example.com/baseline.png",
        alt: " Baseline logo ",
        width: 120,
        height: 80,
      },
    },
    patch: {
      siteName: " Updated site ",
      tagline: " Updated tagline ",
      logo: {
        src: "https://example.com/patch.png",
        alt: " Patch logo ",
        width: 100,
        height: 60,
      },
    },
    expectedRevision: 4,
  };

  const result = adaptUpdateIdentityIntent(intent);

  assert.equal(result.baseline.siteName, "Baseline site");
  assert.equal(result.baseline.tagline, "Baseline tagline");
  assert.deepEqual(result.patch, {
    siteName: "Updated site",
    tagline: "Updated tagline",
    logo: {
      src: "https://example.com/patch.png",
      alt: "Patch logo",
      width: 100,
      height: 60,
    },
  });
  assert.equal("faviconMediaAssetId" in result.baseline, false);
  assert.equal("faviconMediaAssetId" in result.patch, false);
  assert.equal("faviconUrl" in result.patch, false);
  assert.equal(result.expectedRevision, 4);
});

void test("preserves identity null logo and leaves absent patch fields absent", () => {
  const result = adaptUpdateIdentityIntent({
    baseline: { ...DEFAULT_IDENTITY_SETTINGS, logo: null },
    patch: { siteName: "Only site name" },
  });

  assert.equal(result.baseline.logo, null);
  assert.deepEqual(result.patch, { siteName: "Only site name" });
  assert.equal("logo" in result.patch, false);
  assert.equal("faviconUrl" in result.patch, false);
});

void test("adapts primary-menu baseline and ordered patch independently", () => {
  const intent: UpdatePrimaryMenuSettingsOCCIntentDTO = {
    baseline: { items: PRIMARY_ITEMS },
    patch: { items: PRIMARY_ITEMS },
    expectedRevision: 5,
  };

  const result = adaptUpdatePrimaryMenuIntent(intent);

  assert.equal(result.patch.items?.[0]?.id, "work");
  assert.equal(result.patch.items?.[1]?.id, "about");
  assert.equal(result.patch.items?.[0]?.children[0]?.id, "detail");
  assert.equal(result.patch.items?.[0]?.label, "Work");
  assert.equal(result.patch.items?.[0]?.href, "/work");
  assert.notEqual(result.baseline.items, intent.baseline.items);
  assert.equal(result.expectedRevision, 5);

  const emptyPatch = adaptUpdatePrimaryMenuIntent({
    baseline: { items: PRIMARY_ITEMS },
    patch: {},
  });
  assert.equal("items" in emptyPatch.patch, false);
});

void test("adapts legal-menu baseline and ordered patch independently", () => {
  const result = adaptUpdateLegalMenuIntent({
    baseline: { items: LEGAL_ITEMS },
    patch: { items: LEGAL_ITEMS },
    expectedRevision: 6,
  } satisfies UpdateLegalMenuSettingsOCCIntentDTO);

  assert.deepEqual(
    result.patch.items?.map((item) => item.id),
    ["legal", "privacy"],
  );
  assert.equal(result.patch.items?.[0]?.label, "Legal");
  assert.equal(result.patch.items?.[1]?.href, "/privacy");
  assert.equal(result.expectedRevision, 6);

  const emptyPatch = adaptUpdateLegalMenuIntent({
    baseline: { items: LEGAL_ITEMS },
    patch: {},
  } satisfies UpdateLegalMenuSettingsOCCIntentDTO);
  assert.equal("items" in emptyPatch.patch, false);
});

void test("adapts social baseline and ordered patch independently", () => {
  const result = adaptUpdateSocialIntent({
    baseline: { items: SOCIAL_ITEMS },
    patch: { items: SOCIAL_ITEMS },
    expectedRevision: 7,
  } satisfies UpdateSocialSettingsOCCIntentDTO);

  assert.deepEqual(
    result.patch.items?.map((item) => item.kind),
    ["website", "github"],
  );
  assert.equal(result.patch.items?.[0]?.href, "https://example.com");
  assert.equal(result.expectedRevision, 7);

  const emptyPatch = adaptUpdateSocialIntent({
    baseline: { items: SOCIAL_ITEMS },
    patch: {},
  } satisfies UpdateSocialSettingsOCCIntentDTO);
  assert.equal("items" in emptyPatch.patch, false);
});

void test("keeps scalar SEO patches separate from baseline composites", () => {
  const baseline: UpdateSeoSettingsOCCIntentDTO["baseline"] = {
    ...DEFAULT_SEO_SETTINGS,
    openGraph: {
      title: "Baseline OG",
      description: null,
      defaultImageUrl: null,
      imageAlt: "",
    },
  };
  const result = adaptUpdateSeoIntent({
    baseline,
    patch: { defaultTitle: " Updated title " },
    expectedRevision: 8,
  });

  assert.equal(result.baseline.openGraph?.title, "Baseline OG");
  assert.deepEqual(result.patch, { defaultTitle: "Updated title" });
  assert.equal("openGraph" in result.patch, false);
  assert.equal("twitter" in result.patch, false);
  assert.equal("structuredData" in result.patch, false);
  assert.equal(result.expectedRevision, 8);
});

void test("completes a partial SEO open-graph patch from its rich baseline", () => {
  const baseline: UpdateSeoSettingsOCCIntentDTO["baseline"] = {
    ...DEFAULT_SEO_SETTINGS,
    openGraph: {
      title: "Baseline OG",
      description: "Baseline description",
      defaultImageUrl: "https://example.com/baseline.png",
      defaultImageMediaAssetId: "asset-baseline",
      imageAlt: "Baseline alt",
    },
  };
  const result = adaptUpdateSeoIntent({
    baseline,
    patch: { openGraph: { title: " Patch OG " } },
  });

  assert.deepEqual(result.patch.openGraph, {
    title: "Patch OG",
    description: "Baseline description",
    defaultImageUrl: "https://example.com/baseline.png",
    defaultImageMediaAssetId: "asset-baseline",
    imageAlt: "Baseline alt",
  });
});

void test("adapts complete SEO open-graph patches from an empty composite baseline", () => {
  const openGraph = {
    title: " Patch OG ",
    description: " Patch description ",
    defaultImageUrl: "https://example.com/patch.png",
    imageAlt: " Patch alt ",
  };
  const result = adaptUpdateSeoIntent({
    baseline: DEFAULT_SEO_SETTINGS,
    patch: { openGraph },
  });

  assert.deepEqual(result.patch.openGraph, {
    title: "Patch OG",
    description: "Patch description",
    defaultImageUrl: "https://example.com/patch.png",
    imageAlt: "Patch alt",
  });
  assert.equal("structuredData" in result.patch, false);
});

void test("removes a stale Open Graph media id when its URL changes or clears", () => {
  const baseline: UpdateSeoSettingsOCCIntentDTO["baseline"] = {
    ...DEFAULT_SEO_SETTINGS,
    openGraph: {
      title: "Baseline OG",
      description: "Baseline description",
      defaultImageUrl: "https://example.com/baseline.png",
      defaultImageMediaAssetId: "asset-baseline",
      imageAlt: "Baseline alt",
    },
  };
  const changed = adaptUpdateSeoIntent({
    baseline,
    patch: { openGraph: { defaultImageUrl: "https://example.com/next.png" } },
  });
  const cleared = adaptUpdateSeoIntent({
    baseline,
    patch: { openGraph: { defaultImageUrl: null } },
  });

  assert.equal(
    changed.patch.openGraph?.defaultImageUrl,
    "https://example.com/next.png",
  );
  assert.equal(
    "defaultImageMediaAssetId" in (changed.patch.openGraph ?? {}),
    false,
  );
  assert.equal(cleared.patch.openGraph?.defaultImageUrl, null);
  assert.equal(
    "defaultImageMediaAssetId" in (cleared.patch.openGraph ?? {}),
    false,
  );
  assert.equal(changed.patch.openGraph?.description, "Baseline description");
  assert.equal(cleared.patch.openGraph?.imageAlt, "Baseline alt");
});

void test("completes Twitter and structured data transport sub-patches from the baseline", () => {
  const baseline: UpdateSeoSettingsOCCIntentDTO["baseline"] = {
    ...DEFAULT_SEO_SETTINGS,
    twitter: {
      card: "summary",
      site: "@baseline",
      creator: "@creator",
    },
    structuredData: {
      enabled: true,
      entityType: "localBusiness",
      name: "Baseline name",
      address: {
        streetAddress: "1 Main Street",
        postalCode: "34000",
        addressLocality: "Montpellier",
      },
      areaServed: ["France"],
      openingHours: ["Mo-Fr 09:00-18:00"],
    },
  };
  const result = adaptUpdateSeoIntent({
    baseline,
    patch: {
      twitter: { site: "@updated" },
      structuredData: {
        name: "Updated name",
        address: { postalCode: "75000" },
      },
    },
  });

  assert.deepEqual(result.patch.twitter, {
    card: "summary",
    site: "@updated",
    creator: "@creator",
  });
  assert.deepEqual(result.patch.structuredData, {
    enabled: true,
    entityType: "localBusiness",
    name: "Updated name",
    address: {
      streetAddress: "1 Main Street",
      postalCode: "75000",
      addressLocality: "Montpellier",
    },
    areaServed: ["France"],
    openingHours: ["Mo-Fr 09:00-18:00"],
  });
});

void test("preserves complete SEO composite clears", () => {
  const result = adaptUpdateSeoIntent({
    baseline: DEFAULT_SEO_SETTINGS,
    patch: { openGraph: null, twitter: null },
  });

  assert.deepEqual(result.patch, { openGraph: null, twitter: null });
});

void test("keeps absent theme groups absent and preserves an empty patch", () => {
  const result = adaptUpdateThemeIntent({
    baseline: DEFAULT_THEME_SETTINGS,
    patch: { mode: "dark" },
    expectedRevision: 9,
  });
  const empty = adaptUpdateThemeIntent({
    baseline: DEFAULT_THEME_SETTINGS,
    patch: {},
    expectedRevision: 10,
  });

  assert.deepEqual(result.patch, { mode: "dark" });
  assert.equal("lightTokens" in result.patch, false);
  assert.equal("darkTokens" in result.patch, false);
  assert.notEqual(
    result.baseline.lightTokens,
    DEFAULT_THEME_SETTINGS.lightTokens,
  );
  assert.notEqual(
    result.baseline.darkTokens,
    DEFAULT_THEME_SETTINGS.darkTokens,
  );
  assert.deepEqual(empty.patch, {});
  assert.equal(empty.expectedRevision, 10);
});

void test("adapts complete theme groups atomically and independently", () => {
  const lightTokens = {
    ...DEFAULT_THEME_SETTINGS.lightTokens,
    background: " #ffffff ",
  };
  const darkTokens = {
    ...DEFAULT_THEME_SETTINGS.darkTokens,
    background: " #000000 ",
  };
  const result = adaptUpdateThemeIntent({
    baseline: DEFAULT_THEME_SETTINGS,
    patch: { lightTokens, darkTokens },
    expectedRevision: 11,
  } satisfies UpdateThemeSettingsOCCIntentDTO);

  assert.deepEqual(result.patch.lightTokens, {
    ...lightTokens,
    background: "#ffffff",
  });
  assert.deepEqual(result.patch.darkTokens, {
    ...darkTokens,
    background: "#000000",
  });
  assert.equal(Object.keys(result.patch.lightTokens ?? {}).length, 20);
  assert.equal(Object.keys(result.patch.darkTokens ?? {}).length, 20);
  assert.notEqual(result.patch.lightTokens, lightTokens);
  assert.notEqual(result.patch.darkTokens, darkTokens);
  assert.equal(result.expectedRevision, 11);
});

void test("completes SEO sub-patches when nullable composites start null", () => {
  const openGraphResult = adaptUpdateSeoIntent({
    baseline: {
      ...DEFAULT_SEO_SETTINGS,
      openGraph: null,
    },
    patch: {
      openGraph: {
        title: " Patch OG ",
      },
    },
  });

  assert.deepEqual(openGraphResult.patch.openGraph, {
    title: "Patch OG",
    description: null,
    defaultImageUrl: null,
    imageAlt: "",
  });

  assert.ok(DEFAULT_SEO_SETTINGS.twitter);

  const twitterResult = adaptUpdateSeoIntent({
    baseline: {
      ...DEFAULT_SEO_SETTINGS,
      twitter: null,
    },
    patch: {
      twitter: {
        site: "@updated",
      },
    },
  });

  assert.deepEqual(twitterResult.patch.twitter, {
    ...DEFAULT_SEO_SETTINGS.twitter,
    site: "@updated",
  });
});
