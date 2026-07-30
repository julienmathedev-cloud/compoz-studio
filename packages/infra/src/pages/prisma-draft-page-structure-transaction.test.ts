/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-transaction.test.ts
 * @layer infra/pages
 * @description In-memory Prisma protocol tests for atomic draft page OCC mutations.
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

type FakeOptions = Readonly<{
  structureRevision?: number;
  primaryHref?: string;
  legalHref?: string;
  metadataCasMisses?: number;
  menuCasMisses?: number;
}>;

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

function fakeTransaction(initialRows: Row[], options: FakeOptions = {}) {
  let rows = structuredClone(initialRows);
  let revision = options.structureRevision ?? 2;
  let metadataCasMisses = options.metadataCasMisses ?? 0;
  let menuCasMisses = options.menuCasMisses ?? 0;
  const calls: string[] = [];
  const pageWrites: Array<{
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }> = [];
  const settingsWrites: unknown[] = [];
  const websiteWrites: unknown[] = [];
  let settings = {
    websiteId: WEBSITE_ID,
    state: "draft" as const,
    header: DEFAULT_HEADER_SETTINGS,
    footer: DEFAULT_FOOTER_SETTINGS,
    primaryMenu: options.primaryHref
      ? {
          items: [
            {
              id: "primary-page",
              label: "Page",
              href: rel(options.primaryHref),
              newTab: false,
              children: [],
            },
          ],
        }
      : DEFAULT_PRIMARY_MENU_SETTINGS,
    legalMenu: options.legalHref
      ? {
          items: [
            {
              id: "legal-page",
              label: "Page",
              href: rel(options.legalHref),
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
        calls.push(input.select?.id ? "website.exists" : "website.revision");
        return input.select?.id
          ? { id: WEBSITE_ID }
          : { draftStructureRevision: revision };
      },
      update: async (input: unknown) => {
        websiteWrites.push(input);
        revision += 1;
        return { draftStructureRevision: revision };
      },
    },
    $queryRaw: async () => {
      calls.push("website.lock");
      return [{ id: WEBSITE_ID }];
    },
    page: {
      findMany: async () =>
        rows
          .filter(
            (item) =>
              item.websiteId === WEBSITE_ID && item.state === "draft",
          )
          .sort((left, right) => left.position - right.position),
      findFirst: async (input: {
        where: {
          websiteId: string;
          state: string;
          slug: string;
          pageId?: { not?: string };
        };
      }) =>
        rows.find(
          (item) =>
            item.websiteId === input.where.websiteId &&
            item.state === input.where.state &&
            item.slug === input.where.slug &&
            item.pageId !== input.where.pageId?.not,
        ) ?? null,
      create: async (input: { data: Row }) => {
        rows.push({
          ...input.data,
          id: `row-${input.data.pageId}`,
          sitemap:
            input.data.sitemap === Prisma.JsonNull
              ? null
              : input.data.sitemap,
          createdAt: NOW,
          updatedAt: NOW,
        });
        return input.data;
      },
      updateMany: async (input: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        pageWrites.push(input);
        if ("metaRevision" in input.where && metadataCasMisses > 0) {
          metadataCasMisses -= 1;
          return { count: 0 };
        }

        let count = 0;
        rows = rows.map((item) => {
          const pageConstraint = input.where["pageId"] as
            | string
            | { in?: string[]; not?: string }
            | undefined;
          const pageMatches =
            typeof pageConstraint === "string"
              ? item.pageId === pageConstraint
              : Array.isArray(pageConstraint?.in)
                ? pageConstraint.in.includes(item.pageId)
                : pageConstraint?.not
                  ? item.pageId !== pageConstraint.not
                  : true;
          const parentMatches =
            !("parentPageId" in input.where) ||
            item.parentPageId === input.where["parentPageId"];
          const metadataMatches =
            !("metaRevision" in input.where) ||
            item.metaRevision === input.where["metaRevision"];
          const paginationMatches =
            !("paginationEnabled" in input.where) ||
            item.paginationEnabled === input.where["paginationEnabled"];

          if (
            item.websiteId !== input.where["websiteId"] ||
            item.state !== input.where["state"] ||
            !pageMatches ||
            !parentMatches ||
            !metadataMatches ||
            !paginationMatches
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
        settingsWrites.push(input);
        if (menuCasMisses > 0) {
          menuCasMisses -= 1;
          return { count: 0 };
        }
        if (
          (input.where.primaryMenuRevision !== undefined &&
            input.where.primaryMenuRevision !==
              settings.primaryMenuRevision) ||
          (input.where.legalMenuRevision !== undefined &&
            input.where.legalMenuRevision !==
              settings.legalMenuRevision)
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
    ) => {
      const rowsBefore = structuredClone(rows);
      const revisionBefore = revision;
      const settingsBefore = structuredClone(settings);
      try {
        return await callback(tx as unknown as Prisma.TransactionClient);
      } catch (error) {
        rows = rowsBefore;
        revision = revisionBefore;
        settings = settingsBefore;
        throw error;
      }
    },
  } as Pick<PrismaClient, "$transaction">;

  return {
    calls,
    pageWrites,
    settingsWrites,
    websiteWrites,
    rows: () => rows,
    settings: () => settings,
    transaction: new PrismaDraftPageStructureTransaction({
      websiteId: WEBSITE_ID,
      client: runner,
      now: () => NOW,
    }),
  };
}

void test("reorder locks, validates and increments structure only for a real change", async () => {
  const fake = fakeTransaction([
    row("parent", null, 0),
    row("a", "parent", 1),
    row("b", "parent", 2),
  ]);

  const same = await fake.transaction.reorder({
    parentPageId: "parent",
    orderedPageIds: ["a", "b"],
    expectedDraftStructureRevision: 2,
  });
  const changed = await fake.transaction.reorder({
    parentPageId: "parent",
    orderedPageIds: ["b", "a"],
    expectedDraftStructureRevision: 2,
  });

  assert.equal(same.draftStructureRevision, 2);
  assert.equal(changed.draftStructureRevision, 3);
  assert.equal(fake.websiteWrites.length, 1);
  assert.ok(fake.calls.indexOf("website.lock") >= 0);
});

void test("create and delete preserve structure planning and pagination normalization", async () => {
  const fake = fakeTransaction([
    row("root", null, 0),
    row("child", "root", 1, {
      paginationEnabled: true,
      metaRevision: 4,
    }),
  ]);
  await fake.transaction.create({
    expectedDraftStructureRevision: 2,
    page: domainPage("other", null),
  });
  const deleted = await fake.transaction.delete({
    pageId: "root",
    expectedDraftStructureRevision: 3,
  });

  assert.equal(deleted.draftStructureRevision, 4);
  assert.equal(
    fake.rows().find((item) => item.pageId === "child")?.paginationEnabled,
    false,
  );
  assert.equal(
    fake.rows().find((item) => item.pageId === "child")?.metaRevision,
    5,
  );
});

void test("metadata CAS writes only resolved columns and leaves blocks and structure untouched", async () => {
  const fake = fakeTransaction([
    row("page", "parent", 0, {
      name: "Page",
      blocks: [],
      blocksRevision: 7,
      metaRevision: 4,
    }),
  ]);
  const result = await fake.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 4,
      changes: {
        name: { baseline: "Page", local: "Renamed" },
      },
    },
  });

  assert.equal(result.page.name, "Renamed");
  assert.deepEqual(result.revisions, {
    metaRevision: 5,
    blocksRevision: 7,
  });
  assert.equal(result.structure, undefined);
  const write = fake.pageWrites.find(
    (item) => "metaRevision" in item.where,
  );
  assert.deepEqual(write?.where, {
    websiteId: WEBSITE_ID,
    state: "draft",
    pageId: "page",
    metaRevision: 4,
  });
  assert.deepEqual(Object.keys(write?.data ?? {}).sort(), [
    "metaRevision",
    "metaUpdatedAt",
    "name",
  ]);
});

void test("same final metadata change and an empty command are no-ops", async () => {
  const fake = fakeTransaction([
    row("page", null, 0, { name: "Renamed", metaRevision: 5 }),
  ]);
  const converged = await fake.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 4,
      changes: {
        name: { baseline: "Page", local: "Renamed" },
      },
    },
  });
  const empty = await fake.transaction.update({ pageId: "page" });

  assert.equal(converged.revisions.metaRevision, 5);
  assert.equal(empty.structure, undefined);
  assert.deepEqual(fake.pageWrites, []);
});

void test("all contradictory metadata fields are reported before any write", async () => {
  const fake = fakeTransaction([
    row("page", null, 0, {
      name: "Remote",
      slug: "remote",
      metaRevision: 6,
    }),
  ]);

  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 4,
          changes: {
            name: { baseline: "Page", local: "Local" },
            slug: { baseline: "page", local: "local" },
          },
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, "PAGE_METADATA_REVISION_CONFLICT");
      const details = error.details as {
        conflicts: Array<{ field: string }>;
      };
      assert.deepEqual(
        details.conflicts.map((item) => item.field),
        ["name", "slug"],
      );
      return true;
    },
  );
  assert.deepEqual(fake.pageWrites, []);
});

void test("metadata and parent writes are atomic and structure is returned only for a real move", async () => {
  const fake = fakeTransaction([
    row("parent", null, 0),
    row("page", null, 1, { name: "Page", metaRevision: 2 }),
  ]);
  const result = await fake.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 2,
      changes: {
        name: { baseline: "Page", local: "Renamed" },
      },
    },
    parentChange: {
      baseline: null,
      local: "parent",
      expectedDraftStructureRevision: 2,
    },
  });

  assert.equal(result.page.parentId, "parent");
  assert.equal(result.page.name, "Renamed");
  assert.equal(result.structure?.draftStructureRevision, 3);
  assert.equal(result.revisions.metaRevision, 3);
});

void test("metadata conflict rolls back parent and structure conflict prevents metadata", async () => {
  const metadataConflict = fakeTransaction([
    row("parent", null, 0),
    row("page", null, 1, { name: "Remote", metaRevision: 3 }),
  ]);
  await assert.rejects(() =>
    metadataConflict.transaction.update({
      pageId: "page",
      metadataChanges: {
        expectedMetaRevision: 2,
        changes: {
          name: { baseline: "Page", local: "Local" },
        },
      },
      parentChange: {
        baseline: null,
        local: "parent",
        expectedDraftStructureRevision: 2,
      },
    }),
  );
  assert.equal(
    metadataConflict.rows().find((item) => item.pageId === "page")
      ?.parentPageId,
    null,
  );

  const structureConflict = fakeTransaction(
    [row("parent", null, 0), row("page", null, 1, { name: "Page" })],
    { structureRevision: 5 },
  );
  await assert.rejects(
    () =>
      structureConflict.transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            name: { baseline: "Page", local: "Local" },
          },
        },
        parentChange: {
          baseline: null,
          local: "parent",
          expectedDraftStructureRevision: 4,
        },
      }),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === "DRAFT_STRUCTURE_REVISION_CONFLICT",
  );
  assert.equal(
    structureConflict.rows().find((item) => item.pageId === "page")?.name,
    "Page",
  );
});

void test("moving a paginated page to root increments metadata revision once", async () => {
  const fake = fakeTransaction([
    row("parent", null, 0),
    row("page", "parent", 1, {
      paginationEnabled: true,
      metaRevision: 8,
    }),
  ]);
  const result = await fake.transaction.update({
    pageId: "page",
    parentChange: {
      baseline: "parent",
      local: null,
      expectedDraftStructureRevision: 2,
    },
  });

  assert.equal(result.page.paginationEnabled, false);
  assert.equal(result.revisions.metaRevision, 9);
  assert.equal(result.structure?.draftStructureRevision, 3);
});

for (const [name, options, expectedWrites] of [
  [
    "both menus",
    { primaryHref: "/old", legalHref: "/old" },
    2,
  ],
  ["primary only", { primaryHref: "/old" }, 1],
  ["legal only", { legalHref: "/old" }, 1],
  ["no menu", {}, 0],
] as const) {
  void test(`slug rename updates ${name} using current transactional revisions`, async () => {
    const fake = fakeTransaction(
      [row("page", null, 0, { slug: "old" })],
      options,
    );
    await fake.transaction.update({
      pageId: "page",
      metadataChanges: {
        expectedMetaRevision: 0,
        changes: {
          slug: { baseline: "old", local: "new" },
        },
      },
    });

    assert.equal(fake.settingsWrites.length, expectedWrites);
  });
}

void test("menu href already replaced by another value is preserved", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    { primaryHref: "/other" },
  );
  await fake.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 0,
      changes: {
        slug: { baseline: "old", local: "new" },
      },
    },
  });

  assert.equal(fake.settings().primaryMenu.items[0]?.href, "/other");
  assert.deepEqual(fake.settingsWrites, []);
});

void test("metadata and menu CAS misses retry the complete transaction and then succeed", async () => {
  const metadata = fakeTransaction(
    [row("page", null, 0, { name: "Page" })],
    { metadataCasMisses: 1 },
  );
  const metadataResult = await metadata.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 0,
      changes: {
        name: { baseline: "Page", local: "Renamed" },
      },
    },
  });
  assert.equal(metadataResult.page.name, "Renamed");
  assert.equal(
    metadata.calls.filter((call) => call === "website.lock").length,
    2,
  );

  const menu = fakeTransaction(
    [row("page", null, 0, { slug: "old" })],
    { primaryHref: "/old", menuCasMisses: 1 },
  );
  const menuResult = await menu.transaction.update({
    pageId: "page",
    metadataChanges: {
      expectedMetaRevision: 0,
      changes: {
        slug: { baseline: "old", local: "new" },
      },
    },
  });
  assert.equal(menuResult.page.slug, "new");
  assert.equal(
    menu.calls.filter((call) => call === "website.lock").length,
    4,
  );
});

void test("three repeated CAS misses produce a stable 409 conflict", async () => {
  const fake = fakeTransaction(
    [row("page", null, 0, { name: "Page" })],
    { metadataCasMisses: 3 },
  );
  await assert.rejects(
    () =>
      fake.transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            name: { baseline: "Page", local: "Renamed" },
          },
        },
      }),
    (error: unknown) =>
      error instanceof DomainError && error.code === "CONFLICT",
  );
  assert.equal(
    fake.calls.filter((call) => call === "website.lock").length,
    3,
  );
  assert.equal(fake.rows()[0]?.name, "Page");
});
