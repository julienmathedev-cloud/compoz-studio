/**
 * @file packages/infra/src/site/prisma-site-repository.test.ts
 * @layer infra/site
 * @description Unit tests for the Prisma draft-footer compare-and-set write.
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
import type { PrismaClient } from "@compoz/infra/prisma/generated";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const WEBSITE_ID = "website-1";
const NEXT_FOOTER = { copyright: "Next", showYear: false };

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
    updateManyCalls,
    createManyCalls,
    getFindCount: () => findCount,
  };
}

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
    /updated footer row not found/,
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
    /created footer row not found/,
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
