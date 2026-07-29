/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-transaction.test.ts
 * @layer infra/pages
 * @description In-memory Prisma protocol tests for locked draft structure mutations.
 * @remarks The invalid DATABASE_URL used by the test command is never contacted.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Page } from "@compoz/core/domain/pages/entities/page";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { rel } from "@compoz/core/domain/urls/href";
import { PrismaDraftPageStructureTransaction } from "@compoz/infra/pages/prisma-draft-page-structure-transaction";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";

const WEBSITE_ID = "website-a";
const NOW = new Date("2026-07-29T10:00:00.000Z");

type Row = {
  id: string;
  websiteId: string;
  state: "draft" | "published";
  pageId: string;
  parentPageId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: unknown;
  sitemap: unknown;
  paginationEnabled: boolean;
  metaRevision: number;
  blocksRevision: number;
  position: number;
  metaCreatedAt: Date;
  metaUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function row(
  pageId: string,
  parentPageId: string | null,
  position: number,
  overrides: Partial<Row> = {},
): Row {
  return {
    id: `row-${pageId}`,
    websiteId: WEBSITE_ID,
    state: "draft",
    pageId,
    parentPageId,
    slug: pageId,
    name: pageId,
    seoTitle: null,
    seoDescription: null,
    blocks: [],
    sitemap: null,
    paginationEnabled: false,
    metaRevision: 0,
    blocksRevision: 0,
    position,
    metaCreatedAt: NOW,
    metaUpdatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function domainPage(pageId: string, parentId: string | null): Page {
  return {
    id: pageId,
    parentId,
    slug: pageId,
    name: pageId,
    seoTitle: null,
    seoDescription: null,
    blocks: [],
    sitemap: null,
    paginationEnabled: false,
    meta: {
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    },
  };
}

function fakeTransaction(
  initialRows: Row[],
  initialRevision = 2,
  menuHrefs?: Readonly<{ primary?: string; legal?: string }>,
) {
  let rows = initialRows.map((item) => ({ ...item }));
  let revision = initialRevision;
  const calls: string[] = [];
  const args = {
    findMany: [] as unknown[],
    updateMany: [] as unknown[],
    deleteMany: [] as unknown[],
    websiteUpdate: [] as unknown[],
    settingsUpdate: [] as unknown[],
  };
  let settings = {
    websiteId: WEBSITE_ID,
    state: "draft" as const,
    header: DEFAULT_HEADER_SETTINGS,
    footer: DEFAULT_FOOTER_SETTINGS,
    primaryMenu: menuHrefs?.primary
      ? {
          items: [
            {
              id: "primary-page",
              label: "Page",
              href: rel(menuHrefs.primary),
              newTab: false,
              children: [],
            },
          ],
        }
      : DEFAULT_PRIMARY_MENU_SETTINGS,
    legalMenu: menuHrefs?.legal
      ? {
          items: [
            {
              id: "legal-page",
              label: "Page",
              href: rel(menuHrefs.legal),
              newTab: false,
            },
          ],
        }
      : DEFAULT_LEGAL_MENU_SETTINGS,
    social: DEFAULT_SOCIAL_SETTINGS,
    identity: DEFAULT_IDENTITY_SETTINGS,
    seo: DEFAULT_SEO_SETTINGS,
    theme: DEFAULT_THEME_SETTINGS,
    headerRevision: 0,
    footerRevision: 0,
    primaryMenuRevision: 0,
    legalMenuRevision: 0,
    socialRevision: 0,
    identityRevision: 0,
    seoRevision: 0,
    themeRevision: 0,
  };

  const tx = {
    website: {
      findUnique: async (input: { select?: { id?: boolean } }) => {
        calls.push(
          input.select?.id ? "website.exists" : "website.revision",
        );
        return input.select?.id
          ? { id: WEBSITE_ID }
          : { draftStructureRevision: revision };
      },
      update: async (input: unknown) => {
        calls.push("website.increment");
        args.websiteUpdate.push(input);
        revision += 1;
        return { draftStructureRevision: revision };
      },
    },
    $queryRaw: async () => {
      calls.push("website.lock");
      return [{ id: WEBSITE_ID }];
    },
    page: {
      findMany: async (input: unknown) => {
        calls.push("page.read");
        args.findMany.push(input);
        return rows
          .filter(
            (item) =>
              item.websiteId === WEBSITE_ID && item.state === "draft",
          )
          .sort((a, b) => a.position - b.position);
      },
      create: async (input: { data: Row }) => {
        calls.push("page.create");
        rows.push({
          ...input.data,
          sitemap:
            input.data.sitemap === Prisma.JsonNull
              ? null
              : input.data.sitemap,
          id: `row-${input.data.pageId}`,
          createdAt: NOW,
          updatedAt: NOW,
        });
        return input.data;
      },
      updateMany: async (input: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        calls.push("page.updateMany");
        args.updateMany.push(input);
        let count = 0;
        rows = rows.map((item) => {
          const where = input.where;
          const pageIds = (where["pageId"] as { in?: string[] } | string | undefined);
          const matchesPage =
            typeof pageIds === "string"
              ? item.pageId === pageIds
              : Array.isArray(pageIds?.in)
                ? pageIds.in.includes(item.pageId)
                : true;
          const matchesParent =
            !("parentPageId" in where) ||
            item.parentPageId === where["parentPageId"];
          if (
            item.websiteId !== where["websiteId"] ||
            item.state !== where["state"] ||
            !matchesPage ||
            !matchesParent
          ) {
            return item;
          }

          count += 1;
          const next = { ...item };
          for (const [key, value] of Object.entries(input.data)) {
            if (
              key === "metaRevision" &&
              typeof value === "object" &&
              value !== null &&
              "increment" in value
            ) {
              next.metaRevision += Number(
                (value as { increment: number }).increment,
              );
            } else {
              Object.assign(next, {
                [key]:
                  key === "sitemap" && value === Prisma.JsonNull
                    ? null
                    : value,
              });
            }
          }
          return next;
        });
        return { count };
      },
      deleteMany: async (input: {
        where: { websiteId: string; state: string; pageId: string };
      }) => {
        calls.push("page.deleteMany");
        args.deleteMany.push(input);
        const before = rows.length;
        rows = rows.filter(
          (item) =>
            !(
              item.websiteId === input.where.websiteId &&
              item.state === input.where.state &&
              item.pageId === input.where.pageId
            ),
        );
        return { count: before - rows.length };
      },
    },
    siteSettings: {
      findUnique: async () => settings,
      updateMany: async (input: {
        where: {
          primaryMenuRevision?: number;
          legalMenuRevision?: number;
        };
        data: {
          primaryMenu?: typeof settings.primaryMenu;
          legalMenu?: typeof settings.legalMenu;
          primaryMenuRevision?: { increment: number };
          legalMenuRevision?: { increment: number };
        };
      }) => {
        args.settingsUpdate.push(input);
        if (
          input.where.primaryMenuRevision !== undefined &&
          input.where.primaryMenuRevision !==
            settings.primaryMenuRevision
        ) {
          return { count: 0 };
        }
        if (
          input.where.legalMenuRevision !== undefined &&
          input.where.legalMenuRevision !== settings.legalMenuRevision
        ) {
          return { count: 0 };
        }
        settings = {
          ...settings,
          ...(input.data.primaryMenu
            ? { primaryMenu: input.data.primaryMenu }
            : {}),
          ...(input.data.legalMenu
            ? { legalMenu: input.data.legalMenu }
            : {}),
          primaryMenuRevision:
            settings.primaryMenuRevision +
            (input.data.primaryMenuRevision?.increment ?? 0),
          legalMenuRevision:
            settings.legalMenuRevision +
            (input.data.legalMenuRevision?.increment ?? 0),
        };
        return { count: 1 };
      },
      createMany: async () => ({ count: 0 }),
    },
  };

  const runner = {
    $transaction: async <T>(
      callback: (client: Prisma.TransactionClient) => Promise<T>,
    ) => callback(tx as unknown as Prisma.TransactionClient),
  } as Pick<PrismaClient, "$transaction">;

  return {
    calls,
    args,
    rows: () => rows,
    revision: () => revision,
    settings: () => settings,
    transaction: new PrismaDraftPageStructureTransaction({
      websiteId: WEBSITE_ID,
      client: runner,
      now: () => NOW,
    }),
  };
}

void test("identical reorder locks and validates but performs no writes or revision increment", async () => {
  const fake = fakeTransaction([
    row("parent", null, 0),
    row("a", "parent", 1),
    row("b", "parent", 2),
  ]);

  const result = await fake.transaction.reorder({
    parentPageId: "parent",
    orderedPageIds: ["a", "b"],
    expectedDraftStructureRevision: 2,
  });

  assert.equal(result.draftStructureRevision, 2);
  assert.deepEqual(fake.args.updateMany, []);
  assert.deepEqual(fake.args.websiteUpdate, []);
  assert.deepEqual(fake.calls.slice(0, 4), [
    "website.exists",
    "website.lock",
    "website.revision",
    "page.read",
  ]);
});

void test("stale revision returns the current snapshot and performs no write", async () => {
  const fake = fakeTransaction([row("page", null, 0)], 8);

  await assert.rejects(
    () =>
      fake.transaction.delete({
        pageId: "page",
        expectedDraftStructureRevision: 7,
      }),
    (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, "DRAFT_STRUCTURE_REVISION_CONFLICT");
      assert.deepEqual(error.details, {
        expectedDraftStructureRevision: 7,
        currentDraftStructureRevision: 8,
        current: {
          index: {
            pages: [
              {
                id: "page",
                slug: "page",
                name: "page",
                parentId: null,
              },
            ],
            updatedAt: NOW.toISOString(),
          },
          draftStructureRevision: 8,
        },
      });
      return true;
    },
  );

  assert.deepEqual(fake.args.updateMany, []);
  assert.deepEqual(fake.args.deleteMany, []);
  assert.deepEqual(fake.args.websiteUpdate, []);
});

void test("delete scopes every write, detaches children, fixes pagination selectively, and increments once", async () => {
  const fake = fakeTransaction([
    row("target", null, 0),
    row("paginated", "target", 4, {
      paginationEnabled: true,
      metaRevision: 5,
    }),
    row("plain", "target", 8, { metaRevision: 9 }),
  ]);

  const result = await fake.transaction.delete({
    pageId: "target",
    expectedDraftStructureRevision: 2,
  });

  assert.equal(result.draftStructureRevision, 3);
  assert.deepEqual(
    fake.rows().map((item) => ({
      id: item.pageId,
      parent: item.parentPageId,
      pagination: item.paginationEnabled,
      metaRevision: item.metaRevision,
      position: item.position,
    })),
    [
      {
        id: "paginated",
        parent: null,
        pagination: false,
        metaRevision: 6,
        position: 0,
      },
      {
        id: "plain",
        parent: null,
        pagination: false,
        metaRevision: 9,
        position: 1,
      },
    ],
  );
  assert.equal(fake.args.websiteUpdate.length, 1);
  assert.deepEqual(fake.args.deleteMany, [
    {
      where: {
        websiteId: WEBSITE_ID,
        state: "draft",
        pageId: "target",
      },
    },
  ]);
  assert.ok(
    fake.args.updateMany.every((value) => {
      const where = (value as { where: Record<string, unknown> }).where;
      return where["websiteId"] === WEBSITE_ID && where["state"] === "draft";
    }),
  );
});

void test("create allocates and normalizes positions under the Website lock", async () => {
  const fake = fakeTransaction([
    row("root", null, 3),
    row("child", "root", 9),
  ]);

  const result = await fake.transaction.create({
    expectedDraftStructureRevision: 2,
    page: domainPage("child-2", "root"),
  });

  assert.equal(result.draftStructureRevision, 3);
  assert.deepEqual(
    fake.rows().map((item) => [item.pageId, item.position]),
    [
      ["root", 0],
      ["child", 1],
      ["child-2", 2],
    ],
  );
  assert.ok(
    fake.calls.indexOf("website.lock") < fake.calls.indexOf("page.create"),
  );
});

void test("same-parent metadata PATCH stays atomic without incrementing the structure revision", async () => {
  const fake = fakeTransaction([row("page", null, 0)]);
  const updated = {
    ...domainPage("page", null),
    name: "Renamed",
    meta: {
      createdAt: NOW.toISOString(),
      updatedAt: "2026-07-29T11:00:00.000Z",
    },
  };

  const result = await fake.transaction.update({
    pageId: "page",
    parentPageId: null,
    expectedDraftStructureRevision: 2,
    metadata: { page: updated, metaRevision: 0 },
  });

  assert.equal(result.draftStructureRevision, 2);
  assert.equal(result.page.name, "Renamed");
  assert.deepEqual(fake.args.websiteUpdate, []);
  const metadataWrite = fake.args.updateMany[0] as {
    data: Record<string, unknown>;
  };
  assert.equal("parentPageId" in metadataWrite.data, false);
});

void test("slug rename updates only referenced menu sections through transaction-scoped CAS", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { primary: "/old", legal: "/old" },
  );
  const updated = {
    ...domainPage("page", null),
    slug: "new",
  };

  await fake.transaction.update({
    pageId: "page",
    metadata: { page: updated, metaRevision: 0 },
    menuRenameExpectedRevisions: {
      expectedPrimaryMenuRevision: 0,
      expectedLegalMenuRevision: 0,
    },
  });

  assert.equal(fake.args.settingsUpdate.length, 2);
  assert.equal(fake.settings().primaryMenuRevision, 1);
  assert.equal(fake.settings().legalMenuRevision, 1);
  assert.equal(fake.settings().primaryMenu.items[0]?.href, "/new");
  assert.equal(fake.settings().legalMenu.items[0]?.href, "/new");
});

for (const [name, menuHrefs, expectedSections] of [
  ["primary", { primary: "/old" }, 1],
  ["legal", { legal: "/old" }, 1],
] as const) {
  void test(`slug rename updates only the ${name} menu when it alone references the page`, async () => {
    const fake = fakeTransaction(
      [row("page", null, 0, { slug: "old" })],
      2,
      menuHrefs,
    );
    await fake.transaction.update({
      pageId: "page",
      metadata: {
        page: { ...domainPage("page", null), slug: "new" },
        metaRevision: 0,
      },
      menuRenameExpectedRevisions: {
        expectedPrimaryMenuRevision: 0,
        expectedLegalMenuRevision: 0,
      },
    });
    assert.equal(fake.args.settingsUpdate.length, expectedSections);
    assert.equal(fake.settings().primaryMenuRevision, name === "primary" ? 1 : 0);
    assert.equal(fake.settings().legalMenuRevision, name === "legal" ? 1 : 0);
  });
}

void test("slug rename without menu references performs no menu writer", async () => {
  const fake = fakeTransaction([row("page", null, 0, { slug: "old" })]);
  await fake.transaction.update({
    pageId: "page",
    metadata: {
      page: { ...domainPage("page", null), slug: "new" },
      metaRevision: 0,
    },
  });
  assert.deepEqual(fake.args.settingsUpdate, []);
});

void test("a stale referenced menu revision preserves the settings conflict code", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { primary: "/old", legal: "/old" },
  );
  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadata: {
          page: { ...domainPage("page", null), slug: "new" },
          metaRevision: 0,
        },
        menuRenameExpectedRevisions: {
          expectedPrimaryMenuRevision: 9,
          expectedLegalMenuRevision: 0,
        },
      }),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === "SETTINGS_SECTION_REVISION_CONFLICT",
  );
});

void test("a stale legal-menu revision preserves the same settings conflict code", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { legal: "/old" },
  );
  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadata: {
          page: { ...domainPage("page", null), slug: "new" },
          metaRevision: 0,
        },
        menuRenameExpectedRevisions: {
          expectedLegalMenuRevision: 9,
        },
      }),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === "SETTINGS_SECTION_REVISION_CONFLICT",
  );
});

void test("a revision is required only for a menu section that is actually changed", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { primary: "/old" },
  );
  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadata: {
          page: { ...domainPage("page", null), slug: "new" },
          metaRevision: 0,
        },
      }),
    (error: unknown) =>
      error instanceof DomainError && error.code === "REVISION_REQUIRED",
  );
});

void test("an unchanged slug ignores forged menu revisions", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { primary: "/old", legal: "/old" },
  );
  await fake.transaction.update({
    pageId: "page",
    menuRenameExpectedRevisions: {
      expectedPrimaryMenuRevision: 0,
      expectedLegalMenuRevision: 0,
    },
  });
  assert.deepEqual(fake.args.settingsUpdate, []);
  assert.equal(fake.settings().primaryMenuRevision, 0);
  assert.equal(fake.settings().legalMenuRevision, 0);
});

void test("runtime rejects independent menu slugs before opening a transaction", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    2,
    { primary: "/old" },
  );

  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadata: {
          page: { ...domainPage("page", null), slug: "new" },
          metaRevision: 0,
        },
        menuRenameExpectedRevisions: {
          expectedPrimaryMenuRevision: 0,
          previousSlug: "forged",
          nextSlug: "forged-next",
        },
      } as never),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === "INVALID_ARGUMENT",
  );

  assert.deepEqual(fake.calls, []);
  assert.deepEqual(fake.args.updateMany, []);
  assert.deepEqual(fake.args.settingsUpdate, []);
});

for (const parentPageId of [null, "parent"] as const) {
  void test(`runtime rejects parentPageId=${String(parentPageId)} without OCC before opening a transaction`, async () => {
    const fake = fakeTransaction([row("page", null, 0)]);

    await assert.rejects(
      () =>
        fake.transaction.update({
          pageId: "page",
          parentPageId,
        } as never),
      (error: unknown) =>
        error instanceof DomainError &&
        error.code === "REVISION_REQUIRED",
    );

    assert.deepEqual(fake.calls, []);
    assert.deepEqual(fake.args.updateMany, []);
    assert.deepEqual(fake.args.websiteUpdate, []);
  });
}

void test("metadata-only update without a parent does not require structure OCC", async () => {
  const fake = fakeTransaction([row("page", null, 0)]);

  const result = await fake.transaction.update({
    pageId: "page",
    metadata: {
      page: { ...domainPage("page", null), name: "Renamed" },
      metaRevision: 0,
    },
  });

  assert.equal(result.page.name, "Renamed");
  assert.equal(result.draftStructureRevision, 2);
});

void test("empty update returns the locked current snapshot without any write", async () => {
  const fake = fakeTransaction([
    row("page", null, 0, { metaRevision: 4 }),
  ]);

  const result = await fake.transaction.update({ pageId: "page" });

  assert.equal(result.draftStructureRevision, 2);
  assert.equal(result.page.meta.updatedAt, NOW.toISOString());
  assert.equal(fake.rows()[0]?.metaRevision, 4);
  assert.deepEqual(fake.args.updateMany, []);
  assert.deepEqual(fake.args.settingsUpdate, []);
  assert.deepEqual(fake.args.websiteUpdate, []);
});

void test("metadata cannot turn a child into home before any write", async () => {
  const fake = fakeTransaction([
    row("parent", null, 0),
    row("child", "parent", 1),
  ]);
  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "child",
        metadata: {
          page: { ...domainPage("child", "parent"), slug: "home" },
          metaRevision: 0,
        },
      }),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === "PAGE_PARENT_INVALID",
  );
  assert.deepEqual(fake.args.updateMany, []);
});
