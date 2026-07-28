/**
 * @file packages/core/src/domain/site/use-cases/update-settings-sections.test.ts
 * @layer core/domain/site/use-cases
 * @description Section-specific OCC wiring tests for the eight settings use cases.
 * @remarks Shared merge and retry behavior is covered separately; this file verifies section mappings, atomic composite semantics, and real business validators.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { asBrandedHref, rel } from "@compoz/core/domain/urls/href";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { Image } from "@compoz/core/domain/assets/entities/image";
import type { FooterSettings } from "@compoz/core/domain/site/entities/footer";
import type { HeaderSettings } from "@compoz/core/domain/site/entities/header";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { LegalMenuSettings } from "@compoz/core/domain/site/entities/legal-menu";
import type { PrimaryMenuSettings } from "@compoz/core/domain/site/entities/primary-menu";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type {
  SiteSettings,
  SiteSettingsWithRevisions,
} from "@compoz/core/domain/site/entities/site-settings";
import type { SocialSettings } from "@compoz/core/domain/site/entities/social";
import type { ThemeSettings } from "@compoz/core/domain/site/entities/theme";
import type {
  CompareAndSetDraftFooterInput,
  CompareAndSetDraftHeaderInput,
  CompareAndSetDraftIdentityInput,
  CompareAndSetDraftLegalMenuInput,
  CompareAndSetDraftPrimaryMenuInput,
  CompareAndSetDraftSeoInput,
  CompareAndSetDraftSocialInput,
  CompareAndSetDraftThemeInput,
  SiteRepository,
} from "@compoz/core/domain/site/ports/site-repository";
import { updateFooterSettings } from "@compoz/core/domain/site/use-cases/footer/update-footer-settings";
import { updateHeaderSettings } from "@compoz/core/domain/site/use-cases/header/update-header-settings";
import { updateIdentitySettings } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings";
import { updateLegalMenuSettings } from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings";
import { updatePrimaryMenuSettings } from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings";
import { updateSeoSettings } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings";
import { updateSocialSettings } from "@compoz/core/domain/site/use-cases/social/update-social-settings";
import { updateThemeSettings } from "@compoz/core/domain/site/use-cases/theme/update-theme-settings";

const LOGO: Image = {
  src: "https://example.com/logo.png",
  alt: "Logo",
  width: 120,
  height: 80,
};

const PRIMARY_ITEMS: PrimaryMenuSettings = {
  items: [
    {
      id: "work",
      label: "Work",
      href: rel("/work"),
      newTab: false,
      children: [],
    },
    {
      id: "about",
      label: "About",
      href: rel("/about"),
      newTab: false,
      children: [],
    },
  ],
};

const PRIMARY_ITEMS_REORDERED: PrimaryMenuSettings = {
  items: [...PRIMARY_ITEMS.items].reverse(),
};

const PRIMARY_ITEMS_LOCAL: PrimaryMenuSettings = {
  items: [
    PRIMARY_ITEMS.items[0],
    {
      id: "contact",
      label: "Contact",
      href: rel("/contact"),
      newTab: false,
      children: [],
    },
  ],
};

const LEGAL_ITEMS: LegalMenuSettings = {
  items: [
    { id: "legal", label: "Legal", href: rel("/legal"), newTab: false },
  ],
};

const LEGAL_ITEMS_SERVER: LegalMenuSettings = {
  items: [
    {
      id: "legal",
      label: "Server legal",
      href: rel("/legal"),
      newTab: false,
    },
  ],
};

const LEGAL_ITEMS_LOCAL: LegalMenuSettings = {
  items: [
    {
      id: "legal",
      label: "Local legal",
      href: rel("/legal"),
      newTab: false,
    },
  ],
};

const SOCIAL_ITEMS: SocialSettings = {
  items: [
    {
      id: "website",
      kind: "website",
      href: asBrandedHref("https://example.com"),
    },
    {
      id: "github",
      kind: "github",
      href: asBrandedHref("https://github.com/example"),
    },
  ],
};

const SOCIAL_ITEMS_REORDERED: SocialSettings = {
  items: [...SOCIAL_ITEMS.items].reverse(),
};

const SOCIAL_ITEMS_LOCAL: SocialSettings = {
  items: [
    SOCIAL_ITEMS.items[0],
    {
      id: "linkedin",
      kind: "linkedin",
      href: asBrandedHref("https://linkedin.com/in/example"),
    },
  ],
};

type CasCalls = {
  footer: CompareAndSetDraftFooterInput[];
  header: CompareAndSetDraftHeaderInput[];
  identity: CompareAndSetDraftIdentityInput[];
  primaryMenu: CompareAndSetDraftPrimaryMenuInput[];
  legalMenu: CompareAndSetDraftLegalMenuInput[];
  social: CompareAndSetDraftSocialInput[];
  seo: CompareAndSetDraftSeoInput[];
  theme: CompareAndSetDraftThemeInput[];
};

function createBundle(
  settings: Partial<SiteSettings> = {},
  revisions: Partial<SiteSettingsWithRevisions["revisions"]> = {},
): SiteSettingsWithRevisions {
  return {
    settings: {
      footer: DEFAULT_FOOTER_SETTINGS,
      header: DEFAULT_HEADER_SETTINGS,
      identity: DEFAULT_IDENTITY_SETTINGS,
      primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
      legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
      social: DEFAULT_SOCIAL_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
      theme: DEFAULT_THEME_SETTINGS,
      ...settings,
    },
    revisions: {
      footerRevision: 11,
      headerRevision: 12,
      identityRevision: 13,
      primaryMenuRevision: 14,
      legalMenuRevision: 15,
      socialRevision: 16,
      seoRevision: 17,
      themeRevision: 18,
      ...revisions,
    },
  };
}

function createRepository(
  reads: readonly SiteSettingsWithRevisions[] = [createBundle()],
) {
  const calls: CasCalls = {
    footer: [],
    header: [],
    identity: [],
    primaryMenu: [],
    legalMenu: [],
    social: [],
    seo: [],
    theme: [],
  };
  let readIndex = 0;

  const repo = {
    ensureBase: async () => undefined,
    readIndex: async () => ({ pages: [], updatedAt: "" }),
    readDraftIndexWithRevision: async () => ({
      index: { pages: [], updatedAt: "" },
      draftStructureRevision: 0,
    }),
    putIndex: async () => undefined,
    readSettings: async () => reads[0].settings,
    readSettingsWithRevisions: async () =>
      reads[Math.min(readIndex++, reads.length - 1)],
    compareAndSetDraftFooter: async (input: CompareAndSetDraftFooterInput) => {
      calls.footer.push(input);
      return { settings: input.footer, revision: input.expectedRevision + 1 };
    },
    compareAndSetDraftHeader: async (input: CompareAndSetDraftHeaderInput) => {
      calls.header.push(input);
      return { settings: input.header, revision: input.expectedRevision + 1 };
    },
    compareAndSetDraftIdentity: async (input: CompareAndSetDraftIdentityInput) => {
      calls.identity.push(input);
      return { settings: input.identity, revision: input.expectedRevision + 1 };
    },
    compareAndSetDraftPrimaryMenu: async (
      input: CompareAndSetDraftPrimaryMenuInput,
    ) => {
      calls.primaryMenu.push(input);
      return {
        settings: input.primaryMenu,
        revision: input.expectedRevision + 1,
      };
    },
    compareAndSetDraftLegalMenu: async (
      input: CompareAndSetDraftLegalMenuInput,
    ) => {
      calls.legalMenu.push(input);
      return {
        settings: input.legalMenu,
        revision: input.expectedRevision + 1,
      };
    },
    compareAndSetDraftSocial: async (input: CompareAndSetDraftSocialInput) => {
      calls.social.push(input);
      return { settings: input.social, revision: input.expectedRevision + 1 };
    },
    compareAndSetDraftSeo: async (input: CompareAndSetDraftSeoInput) => {
      calls.seo.push(input);
      return { settings: input.seo, revision: input.expectedRevision + 1 };
    },
    compareAndSetDraftTheme: async (input: CompareAndSetDraftThemeInput) => {
      calls.theme.push(input);
      return { settings: input.theme, revision: input.expectedRevision + 1 };
    },
    putSettings: async () => undefined,
  } satisfies SiteRepository;

  return { repo, calls };
}

async function expectConflict(
  run: () => Promise<unknown>,
  resourceId: string,
  currentRevision: number,
  conflictingPaths: string[],
): Promise<void> {
  await assert.rejects(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT);
    assert.deepEqual(error.details, {
      resourceId,
      expectedRevision: 1,
      currentRevision,
      conflictingPaths,
    });
    return true;
  });
}

async function expectDomainError(
  run: () => Promise<unknown>,
): Promise<void> {
  await assert.rejects(run, (error: unknown) => error instanceof DomainError);
}

void test("maps the eight section use cases to their exact read revision and CAS payload", async () => {
  const bundle = createBundle();
  const { repo, calls } = createRepository([bundle]);
  const footer: FooterSettings = { ...DEFAULT_FOOTER_SETTINGS, copyright: "Footer" };
  const header: HeaderSettings = { ...DEFAULT_HEADER_SETTINGS, blur: true };
  const identity: IdentitySettings = {
    ...DEFAULT_IDENTITY_SETTINGS,
    siteName: "Identity",
  };
  const seo: SeoSettings = { ...DEFAULT_SEO_SETTINGS, defaultTitle: "SEO" };
  const theme: ThemeSettings = { ...DEFAULT_THEME_SETTINGS, mode: "dark" };

  const results = await Promise.all([
    updateFooterSettings({ repo })({
      baseline: DEFAULT_FOOTER_SETTINGS,
      patch: { copyright: "Footer" },
      expectedRevision: 1,
    }),
    updateHeaderSettings({ repo })({
      baseline: DEFAULT_HEADER_SETTINGS,
      patch: { blur: true },
      expectedRevision: 1,
    }),
    updateIdentitySettings({ repo })({
      baseline: DEFAULT_IDENTITY_SETTINGS,
      patch: { siteName: "Identity" },
      expectedRevision: 1,
    }),
    updatePrimaryMenuSettings({ repo })({
      baseline: DEFAULT_PRIMARY_MENU_SETTINGS,
      patch: PRIMARY_ITEMS,
      expectedRevision: 1,
    }),
    updateLegalMenuSettings({ repo })({
      baseline: DEFAULT_LEGAL_MENU_SETTINGS,
      patch: LEGAL_ITEMS,
      expectedRevision: 1,
    }),
    updateSocialSettings({ repo })({
      baseline: DEFAULT_SOCIAL_SETTINGS,
      patch: SOCIAL_ITEMS,
      expectedRevision: 1,
    }),
    updateSeoSettings({ repo })({
      baseline: DEFAULT_SEO_SETTINGS,
      patch: { defaultTitle: "SEO" },
      expectedRevision: 1,
    }),
    updateThemeSettings({ repo })({
      baseline: DEFAULT_THEME_SETTINGS,
      patch: { mode: "dark" },
      expectedRevision: 1,
    }),
  ]);

  const expected = [
    ["footer", "footerRevision", footer],
    ["header", "headerRevision", header],
    ["identity", "identityRevision", identity],
    ["primaryMenu", "primaryMenuRevision", PRIMARY_ITEMS],
    ["legalMenu", "legalMenuRevision", LEGAL_ITEMS],
    ["social", "socialRevision", SOCIAL_ITEMS],
    ["seo", "seoRevision", seo],
    ["theme", "themeRevision", theme],
  ] as const;

  for (const [index, [section, revisionKey, settings]] of expected.entries()) {
    const currentRevision = bundle.revisions[revisionKey];
    const call = calls[section][0];

    assert.deepEqual(results[index], {
      settings,
      revision: currentRevision + 1,
    });
    assert.deepEqual(call, {
      expectedRevision: currentRevision,
      [section]: settings,
    });
    assert.deepEqual(Object.keys(call).sort(), ["expectedRevision", section].sort());
  }
});

void test("header preserves a same concurrent boolean change without CAS", async () => {
  const current = { ...DEFAULT_HEADER_SETTINGS, blur: true };
  const { repo, calls } = createRepository([
    createBundle({ header: current }, { headerRevision: 22 }),
  ]);

  const result = await updateHeaderSettings({ repo })({
    baseline: DEFAULT_HEADER_SETTINGS,
    patch: { blur: true },
    expectedRevision: 1,
  });

  assert.deepEqual(result, { settings: current, revision: 22 });
  assert.deepEqual(calls.header, []);
});

void test("identity treats structurally equal logos as unchanged and keeps absent optional fields absent", async () => {
  const baseline: IdentitySettings = { ...DEFAULT_IDENTITY_SETTINGS, logo: LOGO };
  const current: IdentitySettings = {
    ...baseline,
    logo: { ...LOGO },
  };
  const { repo, calls } = createRepository([
    createBundle({ identity: current }, { identityRevision: 23 }),
  ]);

  const result = await updateIdentitySettings({ repo })({
    baseline,
    patch: { logo: { ...LOGO } },
    expectedRevision: 1,
  });

  assert.deepEqual(result, { settings: current, revision: 23 });
  assert.equal("faviconMediaAssetId" in result.settings, false);
  assert.deepEqual(calls.identity, []);
});

void test("identity reports a divergent logo conflict", async () => {
  const baseline: IdentitySettings = { ...DEFAULT_IDENTITY_SETTINGS, logo: LOGO };
  const { repo, calls } = createRepository([
    createBundle(
      { identity: { ...baseline, logo: { ...LOGO, src: "https://example.com/server.png" } } },
      { identityRevision: 24 },
    ),
  ]);

  await expectConflict(
    () =>
      updateIdentitySettings({ repo })({
        baseline,
        patch: { logo: { ...LOGO, src: "https://example.com/local.png" } },
        expectedRevision: 1,
      }),
    "identity",
    24,
    ["logo"],
  );
  assert.deepEqual(calls.identity, []);
});

void test("primary menu treats equal arrays as unchanged and reports divergent order", async () => {
  const current: PrimaryMenuSettings = {
    items: PRIMARY_ITEMS.items.map((item) => ({ ...item })),
  };
  const equalContext = createRepository([
    createBundle(
      { primaryMenu: current },
      { primaryMenuRevision: 25 },
    ),
  ]);
  const conflictContext = createRepository([
    createBundle(
      { primaryMenu: PRIMARY_ITEMS_REORDERED },
      { primaryMenuRevision: 26 },
    ),
  ]);

  const result = await updatePrimaryMenuSettings({ repo: equalContext.repo })({
    baseline: PRIMARY_ITEMS,
    patch: { items: PRIMARY_ITEMS.items.map((item) => ({ ...item })) },
    expectedRevision: 1,
  });

  assert.deepEqual(result, {
    settings: current,
    revision: 25,
  });
  assert.deepEqual(equalContext.calls.primaryMenu, []);
  await expectConflict(
    () =>
      updatePrimaryMenuSettings({ repo: conflictContext.repo })({
        baseline: PRIMARY_ITEMS,
        patch: PRIMARY_ITEMS_LOCAL,
        expectedRevision: 1,
      }),
    "primaryMenu",
    26,
    ["items"],
  );
  assert.deepEqual(conflictContext.calls.primaryMenu, []);
});

void test("primary menu rejects an invalid merged fixture before CAS", async () => {
  const { repo, calls } = createRepository();
  const invalid: PrimaryMenuSettings = {
    items: [{ id: "", label: "", href: rel("/"), newTab: false, children: [] }],
  };

  await expectDomainError(
    () =>
      updatePrimaryMenuSettings({ repo })({
        baseline: DEFAULT_PRIMARY_MENU_SETTINGS,
        patch: invalid,
        expectedRevision: 1,
      }),
  );
  assert.deepEqual(calls.primaryMenu, []);
});

void test("legal menu treats equal arrays as unchanged and reports divergent arrays", async () => {
  const equalContext = createRepository([
    createBundle(
      { legalMenu: { items: LEGAL_ITEMS.items.map((item) => ({ ...item })) } },
      { legalMenuRevision: 27 },
    ),
  ]);
  const conflictContext = createRepository([
    createBundle({ legalMenu: LEGAL_ITEMS_SERVER }, { legalMenuRevision: 28 }),
  ]);

  const result = await updateLegalMenuSettings({ repo: equalContext.repo })({
    baseline: LEGAL_ITEMS,
    patch: { items: LEGAL_ITEMS.items.map((item) => ({ ...item })) },
    expectedRevision: 1,
  });

  assert.equal(result.revision, 27);
  assert.deepEqual(equalContext.calls.legalMenu, []);
  await expectConflict(
    () =>
      updateLegalMenuSettings({ repo: conflictContext.repo })({
        baseline: LEGAL_ITEMS,
        patch: LEGAL_ITEMS_LOCAL,
        expectedRevision: 1,
      }),
    "legalMenu",
    28,
    ["items"],
  );
  assert.deepEqual(conflictContext.calls.legalMenu, []);
});

void test("legal menu rejects an invalid merged fixture before CAS", async () => {
  const { repo, calls } = createRepository();
  const invalid: LegalMenuSettings = {
    items: [{ id: "", label: "", href: rel("/legal"), newTab: false }],
  };

  await expectDomainError(
    () =>
      updateLegalMenuSettings({ repo })({
        baseline: DEFAULT_LEGAL_MENU_SETTINGS,
        patch: invalid,
        expectedRevision: 1,
      }),
  );
  assert.deepEqual(calls.legalMenu, []);
});

void test("social preserves equal ordered arrays and reports an order conflict", async () => {
  const equalContext = createRepository([
    createBundle(
      { social: { items: SOCIAL_ITEMS.items.map((item) => ({ ...item })) } },
      { socialRevision: 29 },
    ),
  ]);
  const conflictContext = createRepository([
    createBundle({ social: SOCIAL_ITEMS_REORDERED }, { socialRevision: 30 }),
  ]);

  const result = await updateSocialSettings({ repo: equalContext.repo })({
    baseline: SOCIAL_ITEMS,
    patch: { items: SOCIAL_ITEMS.items.map((item) => ({ ...item })) },
    expectedRevision: 1,
  });

  assert.equal(result.revision, 29);
  assert.deepEqual(equalContext.calls.social, []);
  await expectConflict(
    () =>
      updateSocialSettings({ repo: conflictContext.repo })({
        baseline: SOCIAL_ITEMS,
        patch: SOCIAL_ITEMS_LOCAL,
        expectedRevision: 1,
      }),
    "social",
    30,
    ["items"],
  );
  assert.deepEqual(conflictContext.calls.social, []);
});

void test("social rejects an invalid merged fixture before CAS", async () => {
  const { repo, calls } = createRepository();
  const invalid: SocialSettings = {
    items: [
      {
        id: "website",
        kind: "website",
        href: asBrandedHref("mailto:hello@example.com"),
      },
    ],
  };

  await expectDomainError(
    () =>
      updateSocialSettings({ repo })({
        baseline: DEFAULT_SOCIAL_SETTINGS,
        patch: invalid,
        expectedRevision: 1,
      }),
  );
  assert.deepEqual(calls.social, []);
});

void test("SEO treats equal open graph values as unchanged and reports structured data conflicts", async () => {
  const openGraph: NonNullable<SeoSettings["openGraph"]> = {
    title: "Open graph",
    description: null,
    defaultImageUrl: null,
    imageAlt: "",
  };
  const baseline: SeoSettings = {
    ...DEFAULT_SEO_SETTINGS,
    openGraph,
  };
  const equalContext = createRepository([
    createBundle(
      { seo: { ...baseline, openGraph: { ...openGraph } } },
      { seoRevision: 31 },
    ),
  ]);
  const conflictContext = createRepository([
    createBundle(
      {
        seo: {
          ...DEFAULT_SEO_SETTINGS,
          structuredData: { ...DEFAULT_SEO_SETTINGS.structuredData, enabled: true },
        },
      },
      { seoRevision: 32 },
    ),
  ]);

  const equalResult = await updateSeoSettings({ repo: equalContext.repo })({
    baseline,
    patch: { openGraph: { ...openGraph } },
    expectedRevision: 1,
  });

  assert.equal(equalResult.revision, 31);
  assert.deepEqual(equalContext.calls.seo, []);
  await expectConflict(
    () =>
      updateSeoSettings({ repo: conflictContext.repo })({
        baseline: DEFAULT_SEO_SETTINGS,
        patch: {
          structuredData: {
            ...DEFAULT_SEO_SETTINGS.structuredData,
            name: "Local name",
          },
        },
        expectedRevision: 1,
      }),
    "seo",
    32,
    ["structuredData"],
  );
  assert.deepEqual(conflictContext.calls.seo, []);
});

void test("SEO merges a local scalar with a concurrent composite change", async () => {
  const current: SeoSettings = {
    ...DEFAULT_SEO_SETTINGS,
    openGraph: {
      title: "Server open graph",
      description: null,
      defaultImageUrl: null,
      imageAlt: "",
    },
  };
  const { repo, calls } = createRepository([
    createBundle({ seo: current }, { seoRevision: 33 }),
  ]);

  const result = await updateSeoSettings({ repo })({
    baseline: DEFAULT_SEO_SETTINGS,
    patch: { defaultTitle: "Local title" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, {
    settings: { ...current, defaultTitle: "Local title" },
    revision: 34,
  });
  assert.deepEqual(calls.seo, [
    {
      expectedRevision: 33,
      seo: { ...current, defaultTitle: "Local title" },
    },
  ]);
});

void test("theme merges disjoint token changes and treats equal light tokens as unchanged", async () => {
  const localLight = { ...DEFAULT_THEME_SETTINGS.lightTokens, background: "#101010" };
  const currentDark = { ...DEFAULT_THEME_SETTINGS.darkTokens, background: "#202020" };
  const mergeContext = createRepository([
    createBundle(
      { theme: { ...DEFAULT_THEME_SETTINGS, darkTokens: currentDark } },
      { themeRevision: 34 },
    ),
  ]);
  const equalContext = createRepository([
    createBundle(
      {
        theme: {
          ...DEFAULT_THEME_SETTINGS,
          lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
        },
      },
      { themeRevision: 35 },
    ),
  ]);

  const merged = await updateThemeSettings({ repo: mergeContext.repo })({
    baseline: DEFAULT_THEME_SETTINGS,
    patch: { lightTokens: localLight },
    expectedRevision: 1,
  });
  const unchanged = await updateThemeSettings({ repo: equalContext.repo })({
    baseline: DEFAULT_THEME_SETTINGS,
    patch: { lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens } },
    expectedRevision: 1,
  });

  assert.deepEqual(merged, {
    settings: {
      ...DEFAULT_THEME_SETTINGS,
      lightTokens: localLight,
      darkTokens: currentDark,
    },
    revision: 35,
  });
  assert.deepEqual(mergeContext.calls.theme, [
    {
      expectedRevision: 34,
      theme: {
        ...DEFAULT_THEME_SETTINGS,
        lightTokens: localLight,
        darkTokens: currentDark,
      },
    },
  ]);
  assert.equal(unchanged.revision, 35);
  assert.deepEqual(equalContext.calls.theme, []);
});

void test("theme reports divergent light tokens and rejects invalid merged settings before CAS", async () => {
  const conflictContext = createRepository([
    createBundle(
      {
        theme: {
          ...DEFAULT_THEME_SETTINGS,
          lightTokens: {
            ...DEFAULT_THEME_SETTINGS.lightTokens,
            background: "#server",
          },
        },
      },
      { themeRevision: 36 },
    ),
  ]);
  const invalidContext = createRepository();

  await expectConflict(
    () =>
      updateThemeSettings({ repo: conflictContext.repo })({
        baseline: DEFAULT_THEME_SETTINGS,
        patch: {
          lightTokens: {
            ...DEFAULT_THEME_SETTINGS.lightTokens,
            background: "#local",
          },
        },
        expectedRevision: 1,
      }),
    "theme",
    36,
    ["lightTokens"],
  );
  await expectDomainError(
    () =>
      updateThemeSettings({ repo: invalidContext.repo })({
        baseline: DEFAULT_THEME_SETTINGS,
        patch: { enableDarkMode: false, mode: "dark" },
        expectedRevision: 1,
      }),
  );
  assert.deepEqual(conflictContext.calls.theme, []);
  assert.deepEqual(invalidContext.calls.theme, []);
});
