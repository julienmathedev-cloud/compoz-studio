/**
 * @file packages/validation/src/site/settings/update-settings-intents.test.ts
 * @layer validation/site/settings
 * @description Shared OCC intent-boundary tests for non-footer settings sections.
 * @remarks Verifies complete baselines, partial outer patches, strict envelopes, revision syntax, and atomic values where the production schema requires them.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { UpdateHeaderSettingsIntentSchema } from "@compoz/validation/site/settings/header/header-intents";
import { UpdateIdentitySettingsIntentSchema } from "@compoz/validation/site/settings/identity/identity-intents";
import { UpdateLegalMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";
import { UpdatePrimaryMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";
import { UpdateSeoSettingsIntentSchema } from "@compoz/validation/site/settings/seo/seo-intents";
import { UpdateSocialSettingsIntentSchema } from "@compoz/validation/site/settings/social/social-intents";
import { UpdateThemeSettingsIntentSchema } from "@compoz/validation/site/settings/theme/theme-intents";

type IntentSchema = Readonly<{
  parse: (input: unknown) => unknown;
  safeParse: (input: unknown) => Readonly<{ success: boolean }>;
}>;

type IntentCase = Readonly<{
  name: string;
  schema: IntentSchema;
  baseline: Record<string, unknown>;
  validPartialPatch: Record<string, unknown>;
  requiredBaselineKey: string;
}>;

const PRIMARY_MENU_ITEMS = [
  {
    id: "work",
    label: "Work",
    href: "/work",
    newTab: false,
    children: [
      { id: "detail", label: "Detail", href: "/work/detail", newTab: false },
    ],
  },
];

const LEGAL_MENU_ITEMS = [
  { id: "legal", label: "Legal", href: "/legal", newTab: false },
];

const SOCIAL_ITEMS = [
  { id: "website", kind: "website", href: "https://example.com" },
  { id: "github", kind: "github", href: "https://github.com/example" },
];

const CASES: readonly IntentCase[] = [
  {
    name: "header",
    schema: UpdateHeaderSettingsIntentSchema,
    baseline: { ...DEFAULT_HEADER_SETTINGS },
    validPartialPatch: { blur: true },
    requiredBaselineKey: "showLogo",
  },
  {
    name: "identity",
    schema: UpdateIdentitySettingsIntentSchema,
    baseline: { ...DEFAULT_IDENTITY_SETTINGS },
    validPartialPatch: { siteName: "Updated site" },
    requiredBaselineKey: "siteName",
  },
  {
    name: "primaryMenu",
    schema: UpdatePrimaryMenuSettingsIntentSchema,
    baseline: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
    validPartialPatch: { items: PRIMARY_MENU_ITEMS },
    requiredBaselineKey: "items",
  },
  {
    name: "legalMenu",
    schema: UpdateLegalMenuSettingsIntentSchema,
    baseline: { ...DEFAULT_LEGAL_MENU_SETTINGS },
    validPartialPatch: { items: LEGAL_MENU_ITEMS },
    requiredBaselineKey: "items",
  },
  {
    name: "social",
    schema: UpdateSocialSettingsIntentSchema,
    baseline: { ...DEFAULT_SOCIAL_SETTINGS },
    validPartialPatch: { items: SOCIAL_ITEMS },
    requiredBaselineKey: "items",
  },
  {
    name: "seo",
    schema: UpdateSeoSettingsIntentSchema,
    baseline: { ...DEFAULT_SEO_SETTINGS },
    validPartialPatch: { defaultTitle: "Updated title" },
    requiredBaselineKey: "structuredData",
  },
  {
    name: "theme",
    schema: UpdateThemeSettingsIntentSchema,
    baseline: {
      ...DEFAULT_THEME_SETTINGS,
      lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
      darkTokens: { ...DEFAULT_THEME_SETTINGS.darkTokens },
    },
    validPartialPatch: { mode: "dark" },
    requiredBaselineKey: "lightTokens",
  },
];

for (const intentCase of CASES) {
  void test(`${intentCase.name} accepts complete baselines and partial OCC patches`, () => {
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: {},
      }).success,
      true,
    );
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: intentCase.validPartialPatch,
      }).success,
      true,
    );
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: {},
        expectedRevision: 0,
      }).success,
      true,
    );
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: {},
        expectedRevision: 7,
      }).success,
      true,
    );
  });

  void test(`${intentCase.name} rejects incomplete and invalid OCC envelopes`, () => {
    const incompleteBaseline = { ...intentCase.baseline };
    delete incompleteBaseline[intentCase.requiredBaselineKey];

    for (const input of [
      { patch: {} },
      { baseline: intentCase.baseline },
      {},
      { baseline: intentCase.baseline, patch: {}, extra: true },
      {
        baseline: { ...intentCase.baseline, extra: true },
        patch: {},
      },
      {
        baseline: intentCase.baseline,
        patch: { ...intentCase.validPartialPatch, extra: true },
      },
      { baseline: incompleteBaseline, patch: {} },
    ]) {
      assert.equal(intentCase.schema.safeParse(input).success, false);
    }

    for (const expectedRevision of [-1, 1.5, "1", null]) {
      assert.equal(
        intentCase.schema.safeParse({
          baseline: intentCase.baseline,
          patch: {},
          expectedRevision,
        }).success,
        false,
      );
    }
  });
}

void test("identity validates complete logos, null clears, and optional property presence", () => {
  const baseline = { ...DEFAULT_IDENTITY_SETTINGS };
  const logo = {
    src: "https://example.com/logo.png",
    alt: "Logo",
    width: 120,
    height: 80,
  };

  assert.equal(
    UpdateIdentitySettingsIntentSchema.safeParse({
      baseline,
      patch: { logo },
    }).success,
    true,
  );
  assert.equal(
    UpdateIdentitySettingsIntentSchema.safeParse({
      baseline,
      patch: { logo: null },
    }).success,
    true,
  );
  assert.equal(
    UpdateIdentitySettingsIntentSchema.safeParse({
      baseline,
      patch: { siteName: "Updated site" },
    }).success,
    true,
  );
  assert.equal(
    UpdateIdentitySettingsIntentSchema.safeParse({
      baseline,
      patch: { logo: { ...logo, extra: true } },
    }).success,
    false,
  );
  assert.equal(
    UpdateIdentitySettingsIntentSchema.safeParse({
      baseline,
      patch: { logo: { src: logo.src, alt: logo.alt } },
    }).success,
    false,
  );
});

void test("menu and social patches preserve complete ordered arrays and reject invalid replacements", () => {
  const cases = [
    {
      schema: UpdatePrimaryMenuSettingsIntentSchema,
      baseline: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
      items: PRIMARY_MENU_ITEMS,
    },
    {
      schema: UpdateLegalMenuSettingsIntentSchema,
      baseline: { ...DEFAULT_LEGAL_MENU_SETTINGS },
      items: LEGAL_MENU_ITEMS,
    },
    {
      schema: UpdateSocialSettingsIntentSchema,
      baseline: { ...DEFAULT_SOCIAL_SETTINGS },
      items: SOCIAL_ITEMS,
    },
  ] as const;

  for (const intentCase of cases) {
    const parsed = intentCase.schema.parse({
      baseline: intentCase.baseline,
      patch: { items: intentCase.items },
    }) as { patch: { items: unknown } };

    assert.deepEqual(parsed.patch.items, intentCase.items);
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: { items: {} },
      }).success,
      false,
    );
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: { items: "not-an-array" },
      }).success,
      false,
    );
    assert.equal(
      intentCase.schema.safeParse({
        baseline: intentCase.baseline,
        patch: { items: [{ id: "partial" }] },
      }).success,
      false,
    );
  }
});

void test("SEO accepts transport sub-patches that the adapter completes before the atomic domain boundary", () => {
  const baseline = { ...DEFAULT_SEO_SETTINGS };
  const openGraph = {
    title: "Open graph",
    description: "Description",
    defaultImageUrl: null,
    imageAlt: "Image",
  };
  const twitter = {
    card: "summary_large_image",
    site: "@compoz",
    creator: "@creator",
  };
  const structuredData = {
    enabled: true,
    entityType: "organization",
    name: "Compoz",
  };
  const parsed = UpdateSeoSettingsIntentSchema.parse({
    baseline,
    patch: { openGraph, twitter, structuredData },
  }) as {
    patch: {
      openGraph: unknown;
      twitter: unknown;
      structuredData: unknown;
    };
  };

  assert.deepEqual(parsed.patch.openGraph, openGraph);
  assert.deepEqual(parsed.patch.twitter, twitter);
  assert.deepEqual(parsed.patch.structuredData, structuredData);
  assert.equal(
    UpdateSeoSettingsIntentSchema.safeParse({
      baseline,
      patch: { openGraph: { ...openGraph, extra: true } },
    }).success,
    false,
  );
  assert.equal(
    UpdateSeoSettingsIntentSchema.safeParse({
      baseline,
      patch: { openGraph: { title: "Partial is supported by this schema" } },
    }).success,
    true,
  );
});

void test("theme token groups are complete, atomic, strict, and optional as groups", () => {
  const baseline = {
    ...DEFAULT_THEME_SETTINGS,
    lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
    darkTokens: { ...DEFAULT_THEME_SETTINGS.darkTokens },
  };

  for (const patch of [
    {},
    { lightTokens: DEFAULT_THEME_SETTINGS.lightTokens },
    { darkTokens: DEFAULT_THEME_SETTINGS.darkTokens },
  ]) {
    assert.equal(
      UpdateThemeSettingsIntentSchema.safeParse({ baseline, patch }).success,
      true,
    );
  }
  for (const patch of [
    { lightTokens: { background: "#ffffff" } },
    { darkTokens: { background: "#ffffff" } },
    {
      lightTokens: {
        ...DEFAULT_THEME_SETTINGS.lightTokens,
        extra: "#ffffff",
      },
    },
  ]) {
    assert.equal(
      UpdateThemeSettingsIntentSchema.safeParse({ baseline, patch }).success,
      false,
    );
  }
});
