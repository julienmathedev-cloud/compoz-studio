/**
 * @file packages/infra/src/site/prisma-site-repository.test.ts
 * @layer infra/site
 * @description Unit tests for the Prisma revisioned settings-section compare-and-set write.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { asBrandedHref, rel } from "@compoz/core/domain/urls/href";
import { type Prisma, type PrismaClient } from "@compoz/infra/prisma/generated";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const WEBSITE_ID = "website-1";
const NEXT_FOOTER = { copyright: "Next", showYear: false };

const NEXT_PRIMARY_MENU = {
  items: [
    {
      id: "primary-test",
      label: "Primary test",
      href: rel("/primary-test"),
      newTab: false,
      children: [],
    },
  ],
};

const NEXT_LEGAL_MENU = {
  items: [
    {
      id: "legal-test",
      label: "Legal test",
      href: rel("/legal-test"),
      newTab: false,
    },
  ],
};

const NEXT_SOCIAL = {
  items: [
    {
      id: "social-test",
      kind: "website" as const,
      href: asBrandedHref("https://example.com/social-test"),
    },
  ],
};

function persistedRow(footerRevision: number, footer = NEXT_FOOTER) {
  return {
    header: DEFAULT_HEADER_SETTINGS,
    footer,
    primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
    legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
    social: DEFAULT_SOCIAL_SETTINGS,
    identity: DEFAULT_IDENTITY_SETTINGS,
    seo: DEFAULT_SEO_SETTINGS,
    theme: DEFAULT_THEME_SETTINGS,
    headerRevision: 0,
    footerRevision,
    primaryMenuRevision: 0,
    legalMenuRevision: 0,
    socialRevision: 0,
    identityRevision: 0,
    seoRevision: 0,
    themeRevision: 0,
  };
}

type FakeOptions = {
  updateCount: number;
  createCount?: number;
  createManyError?: unknown;
  readRow?: ReturnType<typeof persistedRow> | null;
};

function createFakeClient(options: FakeOptions) {
  const updateManyCalls: unknown[] = [];
  const createManyCalls: unknown[] = [];
  let findCount = 0;

  const tx = {
    siteSettings: {
      updateMany: async (args: unknown) => {
        updateManyCalls.push(args);
        return { count: options.updateCount };
      },
      findUnique: async () => {
        findCount += 1;

        if ("readRow" in options) return options.readRow;
        return options.updateCount === 1 ? persistedRow(4) : persistedRow(1);
      },
      createMany: async (args: unknown) => {
        createManyCalls.push(args);
        if (options.createManyError) throw options.createManyError;
        return { count: options.createCount ?? 1 };
      },
    },
  };

  const client = {
    $transaction: async <T>(run: (transaction: typeof tx) => Promise<T>) =>
      run(tx),
  } as unknown as PrismaClient;

  return {
    client,
    transactionClient: tx as unknown as Prisma.TransactionClient,
    updateManyCalls,
    createManyCalls,
    getFindCount: () => findCount,
  };
}

const SECTION_CAS_CASES = [
  {
    section: "footer",
    revision: "footerRevision",
    settings: NEXT_FOOTER,
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftFooter({
        expectedRevision,
        footer: NEXT_FOOTER,
      }),
  },
  {
    section: "header",
    revision: "headerRevision",
    settings: { ...DEFAULT_HEADER_SETTINGS, blur: true },
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftHeader({
        expectedRevision,
        header: { ...DEFAULT_HEADER_SETTINGS, blur: true },
      }),
  },
  {
    section: "identity",
    revision: "identityRevision",
    settings: { ...DEFAULT_IDENTITY_SETTINGS, siteName: "Identity" },
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftIdentity({
        expectedRevision,
        identity: { ...DEFAULT_IDENTITY_SETTINGS, siteName: "Identity" },
      }),
  },
  {
    section: "primaryMenu",
    revision: "primaryMenuRevision",
    settings: NEXT_PRIMARY_MENU,
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftPrimaryMenu({
        expectedRevision,
        primaryMenu: NEXT_PRIMARY_MENU,
      }),
  },
  {
    section: "legalMenu",
    revision: "legalMenuRevision",
    settings: NEXT_LEGAL_MENU,
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftLegalMenu({
        expectedRevision,
        legalMenu: NEXT_LEGAL_MENU,
      }),
  },
  {
    section: "social",
    revision: "socialRevision",
    settings: NEXT_SOCIAL,
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftSocial({
        expectedRevision,
        social: NEXT_SOCIAL,
      }),
  },
  {
    section: "seo",
    revision: "seoRevision",
    settings: { ...DEFAULT_SEO_SETTINGS, defaultTitle: "SEO" },
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftSeo({
        expectedRevision,
        seo: { ...DEFAULT_SEO_SETTINGS, defaultTitle: "SEO" },
      }),
  },
  {
    section: "theme",
    revision: "themeRevision",
    settings: { ...DEFAULT_THEME_SETTINGS, mode: "dark" as const },
    run: (repository: PrismaSiteRepository, expectedRevision: number) =>
      repository.compareAndSetDraftTheme({
        expectedRevision,
        theme: { ...DEFAULT_THEME_SETTINGS, mode: "dark" },
      }),
  },
] as const;

void test("maps every settings CAS primitive to only its section and revision", async () => {
  for (const sectionCase of SECTION_CAS_CASES) {
    const revision = 37;
    const row = {
      ...persistedRow(0),
      [sectionCase.section]: sectionCase.settings,
      [sectionCase.revision]: revision + 1,
    };
    const fake = createFakeClient({
      updateCount: 1,
      readRow: row,
    });
    const repository = new PrismaSiteRepository({
      websiteId: WEBSITE_ID,
      client: fake.client,
    });

    const result = await sectionCase.run(repository, revision);
    const call = fake.updateManyCalls[0] as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    };

    assert.deepEqual(call.where, {
      websiteId: WEBSITE_ID,
      state: "draft",
      [sectionCase.revision]: revision,
    });
    assert.deepEqual(call.data, {
      [sectionCase.section]: sectionCase.settings,
      [sectionCase.revision]: { increment: 1 },
    });
    assert.deepEqual(result, {
      settings: sectionCase.settings,
      revision: revision + 1,
    });
  }
});

void test("creates complete draft defaults with only the targeted section revision", async () => {
  const sections = [
    "footer",
    "header",
    "identity",
    "primaryMenu",
    "legalMenu",
    "social",
    "seo",
    "theme",
  ] as const;
  const revisions = [
    "footerRevision",
    "headerRevision",
    "identityRevision",
    "primaryMenuRevision",
    "legalMenuRevision",
    "socialRevision",
    "seoRevision",
    "themeRevision",
  ] as const;
  const defaults = {
    footer: DEFAULT_FOOTER_SETTINGS,
    header: DEFAULT_HEADER_SETTINGS,
    identity: DEFAULT_IDENTITY_SETTINGS,
    primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
    legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
    social: DEFAULT_SOCIAL_SETTINGS,
    seo: DEFAULT_SEO_SETTINGS,
    theme: DEFAULT_THEME_SETTINGS,
  };

  for (const sectionCase of SECTION_CAS_CASES) {
    const row = {
      ...persistedRow(0),
      [sectionCase.section]: sectionCase.settings,
      [sectionCase.revision]: 1,
    };
    const fake = createFakeClient({
      updateCount: 0,
      readRow: row,
    });
    const repository = new PrismaSiteRepository({
      websiteId: WEBSITE_ID,
      client: fake.client,
    });

    const result = await sectionCase.run(repository, 0);
    const call = fake.createManyCalls[0] as {
      data: Record<string, unknown>;
      skipDuplicates: boolean;
    };

    assert.equal(fake.createManyCalls.length, 1);
    assert.equal(call.skipDuplicates, true);
    assert.equal(call.data.websiteId, WEBSITE_ID);
    assert.equal(call.data.state, "draft");
    assert.deepEqual(call.data[sectionCase.section], sectionCase.settings);

    for (const section of sections) {
      if (section !== sectionCase.section) {
        assert.deepEqual(call.data[section], defaults[section]);
      }
    }

    assert.equal(call.data[sectionCase.revision], 1);
    for (const revision of revisions) {
      if (revision !== sectionCase.revision) {
        assert.notEqual(call.data[revision], 1);
      }
    }
    assert.deepEqual(
      revisions.filter((revision) => revision in call.data),
      [sectionCase.revision],
    );
    assert.deepEqual(result, {
      settings: sectionCase.settings,
      revision: 1,
    });
  }
});

void test("uses a TransactionClient without starting a nested transaction", async () => {
  const identity = {
    ...DEFAULT_IDENTITY_SETTINGS,
    siteName: "Transaction identity",
  };
  const row = {
    ...persistedRow(0),
    identity,
    identityRevision: 4,
  };
  const callbackFake = createFakeClient({ updateCount: 1, readRow: row });
  const transactionFake = createFakeClient({ updateCount: 1, readRow: row });
  const callbackRepository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: callbackFake.client,
  });
  const transactionRepository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: transactionFake.transactionClient,
  });

  const callbackResult = await callbackRepository.compareAndSetDraftIdentity({
    expectedRevision: 3,
    identity,
  });
  const transactionResult =
    await transactionRepository.compareAndSetDraftIdentity({
      expectedRevision: 3,
      identity,
    });

  assert.deepEqual(transactionResult, callbackResult);
  assert.deepEqual(transactionResult, { settings: identity, revision: 4 });
  assert.equal(transactionFake.updateManyCalls.length, 1);
  assert.equal("$transaction" in transactionFake.transactionClient, false);
});

void test("filters the footer update by draft revision and writes only footer CAS data", async () => {
  const fake = createFakeClient({ updateCount: 1 });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  const result = await repository.compareAndSetDraftFooter({
    expectedRevision: 3,
    footer: NEXT_FOOTER,
  });

  assert.deepEqual(fake.updateManyCalls, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        footerRevision: 3,
      },
      data: {
        footer: NEXT_FOOTER,
        footerRevision: { increment: 1 },
      },
    },
  ]);
  assert.deepEqual(result, { settings: NEXT_FOOTER, revision: 4 });
  assert.equal(fake.getFindCount(), 1);
});

void test("rejects when the updated footer row cannot be read atomically", async () => {
  const fake = createFakeClient({ updateCount: 1, readRow: null });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  await assert.rejects(
    () =>
      repository.compareAndSetDraftFooter({
        expectedRevision: 3,
        footer: NEXT_FOOTER,
      }),
    /updated draft settings row not found/,
  );
});

void test("returns null on a revision mismatch", async () => {
  const fake = createFakeClient({ updateCount: 0 });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  const result = await repository.compareAndSetDraftFooter({
    expectedRevision: 2,
    footer: NEXT_FOOTER,
  });

  assert.equal(result, null);
  assert.equal(fake.getFindCount(), 0);
  assert.deepEqual(fake.createManyCalls, []);
});

void test("creates a complete default row at footer revision one when revision zero is absent", async () => {
  const fake = createFakeClient({ updateCount: 0 });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  const result = await repository.compareAndSetDraftFooter({
    expectedRevision: 0,
    footer: NEXT_FOOTER,
  });

  assert.deepEqual(result, { settings: NEXT_FOOTER, revision: 1 });
  assert.equal(fake.createManyCalls.length, 1);
  assert.equal(fake.getFindCount(), 1);

  const call = fake.createManyCalls[0] as {
    data: Record<string, unknown>;
    skipDuplicates: boolean;
  };
  assert.equal(call.skipDuplicates, true);
  assert.deepEqual(call.data.footer, NEXT_FOOTER);
  assert.equal(call.data.footerRevision, 1);
  assert.deepEqual(call.data.header, DEFAULT_HEADER_SETTINGS);
  assert.deepEqual(call.data.primaryMenu, DEFAULT_PRIMARY_MENU_SETTINGS);
  assert.deepEqual(call.data.legalMenu, DEFAULT_LEGAL_MENU_SETTINGS);
  assert.deepEqual(call.data.social, DEFAULT_SOCIAL_SETTINGS);
  assert.deepEqual(call.data.identity, DEFAULT_IDENTITY_SETTINGS);
  assert.deepEqual(call.data.seo, DEFAULT_SEO_SETTINGS);
  assert.deepEqual(call.data.theme, DEFAULT_THEME_SETTINGS);
  assert.equal(call.data.websiteId, WEBSITE_ID);
  assert.equal(call.data.state, "draft");
});

void test("returns null when createMany skips a duplicate footer row", async () => {
  const fake = createFakeClient({
    updateCount: 0,
    createCount: 0,
  });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  const result = await repository.compareAndSetDraftFooter({
    expectedRevision: 0,
    footer: NEXT_FOOTER,
  });

  assert.equal(result, null);
  assert.equal(fake.getFindCount(), 0);
});

void test("rejects when the created footer row cannot be read atomically", async () => {
  const fake = createFakeClient({
    updateCount: 0,
    createCount: 1,
    readRow: null,
  });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  await assert.rejects(
    () =>
      repository.compareAndSetDraftFooter({
        expectedRevision: 0,
        footer: NEXT_FOOTER,
      }),
    /created draft settings row not found/,
  );
});

void test("does not convert other Prisma creation errors into CAS misses", async () => {
  const technicalError = new Error("database unavailable");
  const fake = createFakeClient({
    updateCount: 0,
    createManyError: technicalError,
  });
  const repository = new PrismaSiteRepository({
    websiteId: WEBSITE_ID,
    client: fake.client,
  });

  await assert.rejects(
    () =>
      repository.compareAndSetDraftFooter({
        expectedRevision: 0,
        footer: NEXT_FOOTER,
      }),
    (error: unknown) => error === technicalError,
  );
});
