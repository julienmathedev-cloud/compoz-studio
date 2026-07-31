/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-transaction.postgres.test.ts
 * @layer infra/pages
 * @description Opt-in PostgreSQL rollback and concurrency tests for draft structure OCC.
 * @remarks Requires TEST_DATABASE_URL whose database name contains "test".
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { rel } from "@compoz/core/domain/urls/href";
import {
  PrismaDraftPageStructureTransaction,
  type DraftStructureTransactionHook,
  type DraftStructureTransactionStage,
} from "@compoz/infra/pages/prisma-draft-page-structure-transaction";
import { Prisma, PrismaClient } from "@compoz/infra/prisma/generated";
import { PrismaPublishSiteTransaction } from "@compoz/infra/site/prisma-publish-site-transaction";
import { PrismaDraftSiteSettingsInitializer } from "@compoz/infra/site/prisma-draft-site-settings-initializer";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL?.trim() ?? "";

function isDedicatedTestDatabase(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.pathname.toLowerCase().includes("test");
  } catch {
    return false;
  }
}

if (TEST_DATABASE_URL && !isDedicatedTestDatabase(TEST_DATABASE_URL)) {
  throw new Error(
    "TEST_DATABASE_URL must explicitly target a database whose name contains 'test'.",
  );
}

const skip = TEST_DATABASE_URL
  ? false
  : "TEST_DATABASE_URL is not configured; PostgreSQL proof was not run.";

function client(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
    log: ["error"],
  });
}

const AT = new Date("2026-07-29T10:00:00.000Z");

function page(id: string, parentId: string | null = null): Page {
  return {
    id,
    parentId,
    slug: id,
    name: id,
    seoTitle: null,
    seoDescription: null,
    blocks: [],
    sitemap: null,
    paginationEnabled: parentId !== null,
    meta: { createdAt: AT.toISOString(), updatedAt: AT.toISOString() },
  };
}

async function seed(
  prisma: PrismaClient,
  websiteId: string,
  pages: ReadonlyArray<Page>,
): Promise<void> {
  await prisma.website.create({
    data: {
      id: websiteId,
      slug: websiteId,
      name: websiteId,
      type: "site",
      pages: {
        create: pages.map((item, position) => ({
          state: "draft",
          pageId: item.id,
          position,
          parentPageId: item.parentId,
          slug: item.slug,
          name: item.name,
          seoTitle: null,
          seoDescription: null,
          blocks: [],
          sitemap: undefined,
          paginationEnabled: item.paginationEnabled,
          metaRevision: 0,
          blocksRevision: 0,
          metaCreatedAt: AT,
          metaUpdatedAt: AT,
        })),
      },
    },
  });
}

async function cleanup(prisma: PrismaClient, websiteId: string): Promise<void> {
  await prisma.website.deleteMany({ where: { id: websiteId } });
}

function settingsWithPageLink(section: "primary" | "legal"): SiteSettings {
  return {
    header: DEFAULT_HEADER_SETTINGS,
    footer: DEFAULT_FOOTER_SETTINGS,
    primaryMenu:
      section === "primary"
        ? {
            items: [
              {
                id: "primary-old",
                label: "Old",
                href: rel("/old"),
                newTab: false,
                children: [],
              },
            ],
          }
        : DEFAULT_PRIMARY_MENU_SETTINGS,
    legalMenu:
      section === "legal"
        ? {
            items: [
              {
                id: "legal-old",
                label: "Old",
                href: rel("/old"),
                newTab: false,
              },
            ],
          }
        : DEFAULT_LEGAL_MENU_SETTINGS,
    social: DEFAULT_SOCIAL_SETTINGS,
    identity: DEFAULT_IDENTITY_SETTINGS,
    seo: DEFAULT_SEO_SETTINGS,
    theme: DEFAULT_THEME_SETTINGS,
  };
}

function barrier(parties: number): DraftStructureTransactionHook {
  let arrived = 0;
  let release: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });

  return async ({ stage }) => {
    if (stage !== "beforeLock") return;
    arrived += 1;
    if (arrived === parties) release?.();
    await ready;
  };
}

void test(
  "every injected deletion failure rolls back parent, pagination, revisions, positions, and Website revision",
  { skip },
  async () => {
    const prisma = client();
    const stages: DraftStructureTransactionStage[] = [
      "afterDetach",
      "afterPagination",
      "afterDelete",
      "duringNormalization",
      "afterNormalization",
      "beforeRevisionIncrement",
      "beforeCommit",
    ];

    try {
      for (const stage of stages) {
        const websiteId = `occ-rollback-${randomUUID()}`;
        await seed(prisma, websiteId, [
          page("target"),
          page("child", "target"),
          page("plain", "target"),
        ]);
        const before = await prisma.page.findMany({
          where: { websiteId, state: "draft" },
          orderBy: { position: "asc" },
        });

        const transaction = new PrismaDraftPageStructureTransaction({
          websiteId,
          client: prisma,
          hook: ({ stage: current }) => {
            if (current === stage) throw new Error(`injected:${stage}`);
          },
        });

        await assert.rejects(
          () =>
            transaction.delete({
              pageId: "target",
              expectedDraftStructureRevision: 0,
            }),
          new RegExp(`injected:${stage}`),
        );

        const [after, website] = await Promise.all([
          prisma.page.findMany({
            where: { websiteId, state: "draft" },
            orderBy: { position: "asc" },
          }),
          prisma.website.findUniqueOrThrow({ where: { id: websiteId } }),
        ]);
        assert.deepEqual(after, before);
        assert.equal(website.draftStructureRevision, 0);
        await cleanup(prisma, websiteId);
      }
    } finally {
      await prisma.$disconnect();
    }
  },
);

type ConcurrentScenario = Readonly<{
  name: string;
  pages: ReadonlyArray<Page>;
  commands: (
    first: PrismaDraftPageStructureTransaction,
    second: PrismaDraftPageStructureTransaction,
  ) => readonly [Promise<unknown>, Promise<unknown>];
}>;

const scenarios: ConcurrentScenario[] = [
  {
    name: "two creations",
    pages: [page("root")],
    commands: (first, second) => [
      first.create({
        page: page("created-a"),
        expectedDraftStructureRevision: 0,
      }),
      second.create({
        page: page("created-b"),
        expectedDraftStructureRevision: 0,
      }),
    ],
  },
  {
    name: "creation against reorder",
    pages: [page("root"), page("a", "root"), page("b", "root")],
    commands: (first, second) => [
      first.create({
        page: page("created"),
        expectedDraftStructureRevision: 0,
      }),
      second.reorder({
        parentPageId: "root",
        orderedPageIds: ["b", "a"],
        expectedDraftStructureRevision: 0,
      }),
    ],
  },
  {
    name: "move against delete",
    pages: [
      page("root-a"),
      page("root-b"),
      page("moving", "root-a"),
    ],
    commands: (first, second) => [
      first.update({
        pageId: "moving",
        parentChange: {
          baseline: "root-a",
          local: "root-b",
          expectedDraftStructureRevision: 0,
        },
      }),
      second.delete({
        pageId: "root-a",
        expectedDraftStructureRevision: 0,
      }),
    ],
  },
  {
    name: "delete against reorder",
    pages: [page("root"), page("a", "root"), page("b", "root")],
    commands: (first, second) => [
      first.delete({
        pageId: "root",
        expectedDraftStructureRevision: 0,
      }),
      second.reorder({
        parentPageId: "root",
        orderedPageIds: ["b", "a"],
        expectedDraftStructureRevision: 0,
      }),
    ],
  },
];

for (const scenario of scenarios) {
  void test(
    `${scenario.name} serializes one success and one OCC conflict`,
    { skip },
    async () => {
      const prisma = client();
      const websiteId = `occ-race-${randomUUID()}`;
      try {
        await seed(prisma, websiteId, scenario.pages);
        const synchronized = barrier(2);
        const first = new PrismaDraftPageStructureTransaction({
          websiteId,
          client: prisma,
          hook: synchronized,
        });
        const second = new PrismaDraftPageStructureTransaction({
          websiteId,
          client: prisma,
          hook: synchronized,
        });

        const settled = await Promise.allSettled(
          scenario.commands(first, second),
        );
        assert.equal(
          settled.filter((result) => result.status === "fulfilled").length,
          1,
        );
        const rejection = settled.find(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        assert.ok(rejection?.reason instanceof DomainError);
        assert.equal(
          rejection.reason.code,
          "DRAFT_STRUCTURE_REVISION_CONFLICT",
        );

        const rows = await prisma.page.findMany({
          where: { websiteId, state: "draft" },
          orderBy: { position: "asc" },
        });
        assert.deepEqual(
          rows.map((item) => item.position),
          rows.map((_item, position) => position),
        );
        assert.equal(
          new Set(rows.map((item) => item.position)).size,
          rows.length,
        );
      } finally {
        await cleanup(prisma, websiteId);
        await prisma.$disconnect();
      }
    },
  );
}

void test(
  "distinct Websites do not share the OCC revision or lock",
  { skip },
  async () => {
    const prisma = client();
    const firstWebsiteId = `occ-isolation-a-${randomUUID()}`;
    const secondWebsiteId = `occ-isolation-b-${randomUUID()}`;
    try {
      await seed(prisma, firstWebsiteId, [page("root-a")]);
      await seed(prisma, secondWebsiteId, [page("root-b")]);
      const synchronized = barrier(2);
      const results = await Promise.all([
        new PrismaDraftPageStructureTransaction({
          websiteId: firstWebsiteId,
          client: prisma,
          hook: synchronized,
        }).create({
          page: page("created-a"),
          expectedDraftStructureRevision: 0,
        }),
        new PrismaDraftPageStructureTransaction({
          websiteId: secondWebsiteId,
          client: prisma,
          hook: synchronized,
        }).create({
          page: page("created-b"),
          expectedDraftStructureRevision: 0,
        }),
      ]);
      assert.deepEqual(
        results.map((result) => result.draftStructureRevision),
        [1, 1],
      );
    } finally {
      await cleanup(prisma, firstWebsiteId);
      await cleanup(prisma, secondWebsiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "publication and a draft structure mutation coexist through the same Website lock",
  { skip },
  async () => {
    const prisma = client();
    const websiteId = `occ-publish-${randomUUID()}`;
    let arrived = 0;
    let release: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const synchronize = async () => {
      arrived += 1;
      if (arrived === 2) release?.();
      await ready;
    };

    try {
      await seed(prisma, websiteId, [page("root")]);
      const structure = new PrismaDraftPageStructureTransaction({
        websiteId,
        client: prisma,
        hook: async ({ stage }) => {
          if (stage === "beforeLock") await synchronize();
        },
      });
      const publication = new PrismaPublishSiteTransaction({
        websiteId,
        client: prisma,
        jitter: () => 0,
        sleep: async () => undefined,
      });

      const [published, created] = await Promise.all([
        publication.run(async (context) => {
          await synchronize();
          const [root, settings] = await Promise.all([
            context.pages.readById(CONTENT_STATE.DRAFT, "root"),
            context.site.readSettings(CONTENT_STATE.DRAFT),
          ]);
          assert.ok(root);
          await context.replacePublishedSnapshot({
            pages: [root],
            settings,
            publishedAt: AT.toISOString(),
          });
          return true;
        }),
        structure.create({
          page: page("created"),
          expectedDraftStructureRevision: 0,
        }),
      ]);

      assert.equal(published, true);
      assert.equal(created.draftStructureRevision, 1);
      assert.equal(
        await prisma.page.count({
          where: { websiteId, state: "published" },
        }),
        1,
      );
      const draftPositions = (
        await prisma.page.findMany({
          where: { websiteId, state: "draft" },
          orderBy: { position: "asc" },
          select: { position: true },
        })
      ).map((item) => item.position);
      assert.deepEqual(draftPositions, [0, 1]);
    } finally {
      await cleanup(prisma, websiteId);
      await prisma.$disconnect();
    }
  },
);

for (const section of ["primary", "legal"] as const) {
  void test(
    `concurrent page rename against ${section} menu yields one CAS winner without loss`,
    { skip },
    async () => {
      const prisma = client();
      const websiteId = `occ-menu-${section}-${randomUUID()}`;

      try {
        await seed(prisma, websiteId, [
          { ...page("page"), slug: "old" },
        ]);
        const setupSite = new PrismaDraftSiteSettingsInitializer({
          websiteId,
          client: prisma,
        });
        await setupSite.initializeDraftSettings(settingsWithPageLink(section));
        const site = new PrismaSiteRepository({
          websiteId,
          client: prisma,
        });
        await site.readSettingsWithRevisions(CONTENT_STATE.DRAFT);

        const structure = new PrismaDraftPageStructureTransaction({
          websiteId,
          client: prisma,
        });
        const [renameResult, menuResult] = await Promise.allSettled([
          structure.update({
            pageId: "page",
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                slug: { baseline: "old", local: "new" },
              },
            },
          }),
          section === "primary"
            ? site.compareAndSetDraftPrimaryMenu({
                expectedRevision: 0,
                primaryMenu: {
                  items: [
                    {
                      id: "primary-concurrent",
                      label: "Concurrent",
                      href: rel("/concurrent"),
                      newTab: false,
                      children: [],
                    },
                  ],
                },
              })
            : site.compareAndSetDraftLegalMenu({
                expectedRevision: 0,
                legalMenu: {
                  items: [
                    {
                      id: "legal-concurrent",
                      label: "Concurrent",
                      href: rel("/concurrent"),
                      newTab: false,
                    },
                  ],
                },
              }),
        ]);
        const renameWon = renameResult.status === "fulfilled";
        const menuWon =
          menuResult.status === "fulfilled" && menuResult.value !== null;
        assert.equal(renameWon, true);

        const [persistedPage, bundle, website] = await Promise.all([
          prisma.page.findUniqueOrThrow({
            where: {
              websiteId_state_pageId: {
                websiteId,
                state: "draft",
                pageId: "page",
              },
            },
          }),
          site.readSettingsWithRevisions(CONTENT_STATE.DRAFT),
          prisma.website.findUniqueOrThrow({ where: { id: websiteId } }),
        ]);
        assert.equal(persistedPage.slug, "new");
        assert.equal(persistedPage.metaRevision, 1);
        assert.equal(website.draftStructureRevision, 0);
        const href =
          section === "primary"
            ? bundle.settings.primaryMenu.items[0]?.href
            : bundle.settings.legalMenu.items[0]?.href;
        assert.equal(href, menuWon ? "/concurrent" : "/new");
      } finally {
        await cleanup(prisma, websiteId);
        await prisma.$disconnect();
      }
    },
  );
}

void test(
  "concurrent footer CAS is preserved while page rename updates its menu",
  { skip },
  async () => {
    const prisma = client();
    const websiteId = `occ-menu-footer-${randomUUID()}`;

    try {
      await seed(prisma, websiteId, [{ ...page("page"), slug: "old" }]);
      const setupSite = new PrismaDraftSiteSettingsInitializer({
        websiteId,
        client: prisma,
      });
      await setupSite.initializeDraftSettings(settingsWithPageLink("primary"));
      const site = new PrismaSiteRepository({
        websiteId,
        client: prisma,
      });
      await site.readSettingsWithRevisions(CONTENT_STATE.DRAFT);
      const structure = new PrismaDraftPageStructureTransaction({
        websiteId,
        client: prisma,
      });
      const [renamed, footer] = await Promise.all([
        structure.update({
          pageId: "page",
          metadataChanges: {
            expectedMetaRevision: 0,
            changes: {
              slug: { baseline: "old", local: "new" },
            },
          },
        }),
        site.compareAndSetDraftFooter({
          expectedRevision: 0,
          footer: { copyright: "Concurrent footer", showYear: false },
        }),
      ]);
      assert.equal(renamed.page.slug, "new");
      assert.ok(footer);

      const bundle = await site.readSettingsWithRevisions(
        CONTENT_STATE.DRAFT,
      );
      assert.equal(bundle.settings.footer.copyright, "Concurrent footer");
      assert.equal(bundle.revisions.footerRevision, 1);
      assert.equal(bundle.settings.primaryMenu.items[0]?.href, "/new");
      assert.equal(bundle.revisions.primaryMenuRevision, 1);
    } finally {
      await cleanup(prisma, websiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "menu OCC conflict rolls back metadata, parent, positions, and Website revision",
  { skip },
  async () => {
    const prisma = client();
    const websiteId = `occ-menu-rollback-${randomUUID()}`;
    try {
      await seed(prisma, websiteId, [
        page("root-a"),
        { ...page("moving", "root-a"), slug: "old" },
        page("root-b"),
      ]);
      const settingsInitializer = new PrismaDraftSiteSettingsInitializer({ websiteId, client: prisma });
      await settingsInitializer.initializeDraftSettings(settingsWithPageLink("primary"));
      const site = new PrismaSiteRepository({ websiteId, client: prisma });
      const before = await prisma.page.findMany({
        where: { websiteId, state: "draft" },
        orderBy: { position: "asc" },
      });

      const transaction = new PrismaDraftPageStructureTransaction({
        websiteId,
        client: prisma,
        hook: async ({ stage }) => {
          if (stage !== "beforeMenuCas") return;
          await prisma.siteSettings.updateMany({
            where: { websiteId, state: "draft" },
            data: { primaryMenuRevision: { increment: 1 } },
          });
        },
      });
      await assert.rejects(
        () =>
          transaction.update({
            pageId: "moving",
            parentChange: {
              baseline: "root-a",
              local: "root-b",
              expectedDraftStructureRevision: 0,
            },
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                slug: { baseline: "old", local: "new" },
              },
            },
          }),
        (error: unknown) =>
          error instanceof DomainError &&
          error.code === "CONFLICT",
      );

      const [after, website, bundle] = await Promise.all([
        prisma.page.findMany({
          where: { websiteId, state: "draft" },
          orderBy: { position: "asc" },
        }),
        prisma.website.findUniqueOrThrow({ where: { id: websiteId } }),
        site.readSettingsWithRevisions(CONTENT_STATE.DRAFT),
      ]);
      assert.deepEqual(after, before);
      assert.equal(website.draftStructureRevision, 0);
      assert.equal(bundle.revisions.primaryMenuRevision, 3);
      assert.equal(bundle.settings.primaryMenu.items[0]?.href, "/old");
    } finally {
      await cleanup(prisma, websiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "metadata merges independent and identical changes while rejecting contradictions",
  { skip },
  async () => {
    const prisma = client();
    const websiteId = `occ-metadata-merge-${randomUUID()}`;
    try {
      await seed(prisma, websiteId, [page("page")]);
      const transaction = new PrismaDraftPageStructureTransaction({
        websiteId,
        client: prisma,
      });

      const renamed = await transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            name: { baseline: "page", local: "Renamed" },
          },
        },
      });
      const independent = await transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            seoTitle: { baseline: null, local: "SEO" },
          },
        },
      });
      const identical = await transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            name: { baseline: "page", local: "Renamed" },
          },
        },
      });

      assert.equal(renamed.revisions.metaRevision, 1);
      assert.equal(independent.page.name, "Renamed");
      assert.equal(independent.page.seoTitle, "SEO");
      assert.equal(independent.revisions.metaRevision, 2);
      assert.equal(identical.revisions.metaRevision, 2);
      assert.equal(identical.revisions.blocksRevision, 0);

      let metadataConflict: DomainError | undefined;
      try {
        await transaction.update({
          pageId: "page",
          metadataChanges: {
            expectedMetaRevision: 0,
            changes: {
              name: { baseline: "page", local: "Other" },
              seoTitle: { baseline: null, local: "Other SEO" },
            },
          },
        });
      } catch (error) {
        if (
          error instanceof DomainError &&
          error.code === "PAGE_METADATA_REVISION_CONFLICT"
        ) {
          metadataConflict = error;
        } else {
          throw error;
        }
      }
      assert.ok(metadataConflict);
      assert.ok(
        metadataConflict.details !== null &&
          typeof metadataConflict.details === "object",
      );
      const conflicts = Reflect.get(
        metadataConflict.details,
        "conflicts",
      );
      assert.ok(Array.isArray(conflicts));
      assert.deepEqual(
        conflicts.map((conflict) =>
          conflict !== null && typeof conflict === "object"
            ? Reflect.get(conflict, "field")
            : undefined,
        ),
        ["name", "seoTitle"],
      );
      const persisted = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId,
            state: "draft",
            pageId: "page",
          },
        },
      });
      assert.equal(persisted.name, "Renamed");
      assert.equal(persisted.seoTitle, "SEO");
      assert.equal(persisted.metaRevision, 2);
      assert.equal(persisted.blocksRevision, 0);
    } finally {
      await cleanup(prisma, websiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "metadata CAS retries after a post-read race and preserves concurrent blocks",
  { skip },
  async () => {
    const prisma = client();
    const websiteId = `occ-metadata-retry-${randomUUID()}`;
    let raced = false;
    try {
      await seed(prisma, websiteId, [page("page")]);
      const transaction = new PrismaDraftPageStructureTransaction({
        websiteId,
        client: prisma,
        hook: async ({ stage }) => {
          if (stage !== "afterRead" || raced) return;
          raced = true;
          await prisma.page.updateMany({
            where: { websiteId, state: "draft", pageId: "page" },
            data: {
              name: "Remote",
              metaRevision: { increment: 1 },
              blocks: [
                {
                  id: "remote-block",
                  type: "section",
                  name: "Remote block",
                  containerMode: "contained",
                  lcpPriority: false,
                  rows: [],
                },
              ],
              blocksRevision: { increment: 1 },
            },
          });
        },
      });

      const result = await transaction.update({
        pageId: "page",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            seoTitle: { baseline: null, local: "SEO" },
          },
        },
      });
      assert.equal(result.page.name, "Remote");
      assert.equal(result.page.seoTitle, "SEO");
      assert.equal(result.page.blocks[0]?.id, "remote-block");
      assert.deepEqual(result.revisions, {
        metaRevision: 2,
        blocksRevision: 1,
      });
    } finally {
      await cleanup(prisma, websiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "metadata retry reclassifies a race as a contradiction and bounds repeated contention",
  { skip },
  async () => {
    const prisma = client();
    const conflictWebsiteId = `occ-metadata-conflict-${randomUUID()}`;
    const boundWebsiteId = `occ-metadata-bound-${randomUUID()}`;
    try {
      await seed(prisma, conflictWebsiteId, [page("page")]);
      let raced = false;
      const conflictTransaction = new PrismaDraftPageStructureTransaction({
        websiteId: conflictWebsiteId,
        client: prisma,
        hook: async ({ stage }) => {
          if (stage !== "afterRead" || raced) return;
          raced = true;
          await prisma.page.updateMany({
            where: {
              websiteId: conflictWebsiteId,
              state: "draft",
              pageId: "page",
            },
            data: { name: "Remote", metaRevision: { increment: 1 } },
          });
        },
      });
      await assert.rejects(
        () =>
          conflictTransaction.update({
            pageId: "page",
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                name: { baseline: "page", local: "Local" },
              },
            },
          }),
        (error: unknown) =>
          error instanceof DomainError &&
          error.code === "PAGE_METADATA_REVISION_CONFLICT",
      );

      await seed(prisma, boundWebsiteId, [page("page")]);
      let attempts = 0;
      const boundTransaction = new PrismaDraftPageStructureTransaction({
        websiteId: boundWebsiteId,
        client: prisma,
        hook: async ({ stage }) => {
          if (stage !== "beforeMetadataCas") return;
          attempts += 1;
          await prisma.page.updateMany({
            where: {
              websiteId: boundWebsiteId,
              state: "draft",
              pageId: "page",
            },
            data: { metaRevision: { increment: 1 } },
          });
        },
      });
      await assert.rejects(
        () =>
          boundTransaction.update({
            pageId: "page",
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                seoTitle: { baseline: null, local: "SEO" },
              },
            },
          }),
        (error: unknown) =>
          error instanceof DomainError && error.code === "CONFLICT",
      );
      assert.equal(attempts, 3);
      const bounded = await prisma.page.findUniqueOrThrow({
        where: {
          websiteId_state_pageId: {
            websiteId: boundWebsiteId,
            state: "draft",
            pageId: "page",
          },
        },
      });
      assert.equal(bounded.seoTitle, null);
      assert.equal(bounded.metaRevision, 3);
    } finally {
      await cleanup(prisma, conflictWebsiteId);
      await cleanup(prisma, boundWebsiteId);
      await prisma.$disconnect();
    }
  },
);

void test(
  "metadata and parent stay atomic while parent normalization increments metadata only when required",
  { skip },
  async () => {
    const prisma = client();
    const successWebsiteId = `occ-composite-success-${randomUUID()}`;
    const metadataConflictWebsiteId =
      `occ-composite-metadata-conflict-${randomUUID()}`;
    const structureConflictWebsiteId =
      `occ-composite-structure-conflict-${randomUUID()}`;
    const paginationWebsiteId =
      `occ-composite-pagination-${randomUUID()}`;
    const websiteIds = [
      successWebsiteId,
      metadataConflictWebsiteId,
      structureConflictWebsiteId,
      paginationWebsiteId,
    ];

    try {
      await seed(prisma, successWebsiteId, [
        page("root-a"),
        page("moving", "root-a"),
        page("root-b"),
      ]);
      const success = await new PrismaDraftPageStructureTransaction({
        websiteId: successWebsiteId,
        client: prisma,
      }).update({
        pageId: "moving",
        metadataChanges: {
          expectedMetaRevision: 0,
          changes: {
            name: { baseline: "moving", local: "Renamed" },
          },
        },
        parentChange: {
          baseline: "root-a",
          local: "root-b",
          expectedDraftStructureRevision: 0,
        },
      });
      assert.equal(success.page.name, "Renamed");
      assert.equal(success.page.parentId, "root-b");
      assert.deepEqual(success.revisions, {
        metaRevision: 1,
        blocksRevision: 0,
      });
      assert.equal(success.structure?.draftStructureRevision, 1);

      await seed(prisma, metadataConflictWebsiteId, [
        page("root-a"),
        page("moving", "root-a"),
        page("root-b"),
      ]);
      await prisma.page.updateMany({
        where: {
          websiteId: metadataConflictWebsiteId,
          state: "draft",
          pageId: "moving",
        },
        data: {
          name: "Remote",
          metaRevision: { increment: 1 },
        },
      });
      await assert.rejects(
        () =>
          new PrismaDraftPageStructureTransaction({
            websiteId: metadataConflictWebsiteId,
            client: prisma,
          }).update({
            pageId: "moving",
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                name: { baseline: "moving", local: "Local" },
              },
            },
            parentChange: {
              baseline: "root-a",
              local: "root-b",
              expectedDraftStructureRevision: 0,
            },
          }),
        (error: unknown) =>
          error instanceof DomainError &&
          error.code === "PAGE_METADATA_REVISION_CONFLICT",
      );
      const afterMetadataConflict =
        await prisma.page.findUniqueOrThrow({
          where: {
            websiteId_state_pageId: {
              websiteId: metadataConflictWebsiteId,
              state: "draft",
              pageId: "moving",
            },
          },
        });
      assert.equal(afterMetadataConflict.name, "Remote");
      assert.equal(afterMetadataConflict.parentPageId, "root-a");

      await seed(prisma, structureConflictWebsiteId, [
        page("root-a"),
        page("moving", "root-a"),
        page("root-b"),
      ]);
      await prisma.website.update({
        where: { id: structureConflictWebsiteId },
        data: { draftStructureRevision: { increment: 1 } },
      });
      await assert.rejects(
        () =>
          new PrismaDraftPageStructureTransaction({
            websiteId: structureConflictWebsiteId,
            client: prisma,
          }).update({
            pageId: "moving",
            metadataChanges: {
              expectedMetaRevision: 0,
              changes: {
                name: { baseline: "moving", local: "Local" },
              },
            },
            parentChange: {
              baseline: "root-a",
              local: "root-b",
              expectedDraftStructureRevision: 0,
            },
          }),
        (error: unknown) =>
          error instanceof DomainError &&
          error.code === "DRAFT_STRUCTURE_REVISION_CONFLICT",
      );
      const afterStructureConflict =
        await prisma.page.findUniqueOrThrow({
          where: {
            websiteId_state_pageId: {
              websiteId: structureConflictWebsiteId,
              state: "draft",
              pageId: "moving",
            },
          },
        });
      assert.equal(afterStructureConflict.name, "moving");
      assert.equal(afterStructureConflict.metaRevision, 0);
      assert.equal(afterStructureConflict.parentPageId, "root-a");

      await seed(prisma, paginationWebsiteId, [
        page("root-a"),
        page("moving", "root-a"),
      ]);
      const normalized = await new PrismaDraftPageStructureTransaction({
        websiteId: paginationWebsiteId,
        client: prisma,
      }).update({
        pageId: "moving",
        parentChange: {
          baseline: "root-a",
          local: null,
          expectedDraftStructureRevision: 0,
        },
      });
      assert.equal(normalized.page.parentId, null);
      assert.equal(normalized.page.paginationEnabled, false);
      assert.deepEqual(normalized.revisions, {
        metaRevision: 1,
        blocksRevision: 0,
      });
      assert.equal(normalized.structure?.draftStructureRevision, 1);
    } finally {
      for (const websiteId of websiteIds) {
        await cleanup(prisma, websiteId);
      }
      await prisma.$disconnect();
    }
  },
);

void test(
  "audit SQL detects dedicated structural anomaly fixtures",
  { skip },
  async () => {
    const prisma = client();
    const suffix = randomUUID();
    const websiteIds = {
      missing: `audit-missing-${suffix}`,
      cross: `audit-cross-${suffix}`,
      crossParent: `audit-cross-parent-${suffix}`,
      published: `audit-published-${suffix}`,
      grandchild: `audit-grandchild-${suffix}`,
      cycle: `audit-cycle-${suffix}`,
      duplicate: `audit-duplicate-${suffix}`,
      gap: `audit-gap-${suffix}`,
      pagination: `audit-pagination-${suffix}`,
      home: `audit-home-${suffix}`,
    };
    const allWebsiteIds = Object.values(websiteIds);

    const createAuditPage = async (args: {
      websiteId: string;
      pageId: string;
      position: number;
      parentPageId?: string | null;
      state?: "draft" | "published";
      slug?: string;
      paginationEnabled?: boolean;
    }) => {
      await prisma.page.create({
        data: {
          websiteId: args.websiteId,
          state: args.state ?? "draft",
          pageId: args.pageId,
          position: args.position,
          parentPageId: args.parentPageId ?? null,
          slug: args.slug ?? args.pageId,
          name: args.pageId,
          seoTitle: null,
          seoDescription: null,
          blocks: [],
          sitemap: Prisma.JsonNull,
          paginationEnabled: args.paginationEnabled ?? false,
          metaRevision: 0,
          blocksRevision: 0,
          metaCreatedAt: AT,
          metaUpdatedAt: AT,
        },
      });
    };

    try {
      await prisma.website.createMany({
        data: allWebsiteIds.map((id) => ({
          id,
          slug: id,
          name: id,
          type: "site" as const,
        })),
      });
      await createAuditPage({
        websiteId: websiteIds.missing,
        pageId: "missing-child",
        parentPageId: "nowhere",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.cross,
        pageId: "cross-child",
        parentPageId: "cross-parent",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.crossParent,
        pageId: "cross-parent",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.published,
        pageId: "published-child",
        parentPageId: "published-parent",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.published,
        pageId: "published-parent",
        position: 0,
        state: "published",
      });
      await createAuditPage({
        websiteId: websiteIds.grandchild,
        pageId: "grand-root",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.grandchild,
        pageId: "grand-middle",
        parentPageId: "grand-root",
        position: 1,
      });
      await createAuditPage({
        websiteId: websiteIds.grandchild,
        pageId: "grand-leaf",
        parentPageId: "grand-middle",
        position: 2,
      });
      await createAuditPage({
        websiteId: websiteIds.cycle,
        pageId: "cycle-a",
        parentPageId: "cycle-b",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.cycle,
        pageId: "cycle-b",
        parentPageId: "cycle-a",
        position: 1,
      });
      await createAuditPage({
        websiteId: websiteIds.duplicate,
        pageId: "duplicate-a",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.duplicate,
        pageId: "duplicate-b",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.gap,
        pageId: "gap-a",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.gap,
        pageId: "gap-b",
        position: 2,
      });
      await createAuditPage({
        websiteId: websiteIds.pagination,
        pageId: "paginated-root",
        position: 0,
        paginationEnabled: true,
      });
      await createAuditPage({
        websiteId: websiteIds.home,
        pageId: "home-parent",
        position: 0,
      });
      await createAuditPage({
        websiteId: websiteIds.home,
        pageId: "home-child",
        parentPageId: "home-parent",
        position: 1,
        slug: "home",
      });

      const auditSql = readFileSync(
        resolve(process.cwd(), "scripts/audit-draft-page-structure.sql"),
        "utf8",
      );
      assert.match(auditSql, /NOT EXISTS[\s\S]*parent\."websiteId" = child\."websiteId"[\s\S]*parent\."state" = child\."state"/);

      const unresolved = await prisma.$queryRaw<Array<{ pageId: string }>>(
        Prisma.sql`
          SELECT child."pageId"
          FROM "Page" child
          WHERE child."websiteId" IN (${Prisma.join(allWebsiteIds)})
            AND child."parentPageId" IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM "Page" parent
              WHERE parent."websiteId" = child."websiteId"
                AND parent."state" = child."state"
                AND parent."pageId" = child."parentPageId"
            )
        `,
      );
      assert.deepEqual(
        new Set(unresolved.map((row) => row.pageId)),
        new Set(["missing-child", "cross-child", "published-child"]),
      );

      const crossWebsite = await prisma.$queryRaw<Array<{ pageId: string }>>(
        Prisma.sql`
          SELECT child."pageId"
          FROM "Page" child
          WHERE child."websiteId" IN (${Prisma.join(allWebsiteIds)})
            AND child."parentPageId" IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM "Page" parent
              WHERE parent."websiteId" = child."websiteId"
                AND parent."state" = child."state"
                AND parent."pageId" = child."parentPageId"
            )
            AND EXISTS (
              SELECT 1 FROM "Page" parent
              WHERE parent."websiteId" <> child."websiteId"
                AND parent."pageId" = child."parentPageId"
            )
        `,
      );
      assert.deepEqual(
        crossWebsite.map((row) => row.pageId),
        ["cross-child"],
      );

      const publishedOnly = await prisma.$queryRaw<
        Array<{ pageId: string }>
      >(Prisma.sql`
        SELECT child."pageId"
        FROM "Page" child
        WHERE child."websiteId" IN (${Prisma.join(allWebsiteIds)})
          AND child."state" = 'draft'
          AND child."parentPageId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "Page" parent
            WHERE parent."websiteId" = child."websiteId"
              AND parent."state" = 'draft'
              AND parent."pageId" = child."parentPageId"
          )
          AND EXISTS (
            SELECT 1 FROM "Page" parent
            WHERE parent."websiteId" = child."websiteId"
              AND parent."state" = 'published'
              AND parent."pageId" = child."parentPageId"
          )
      `);
      assert.deepEqual(
        publishedOnly.map((row) => row.pageId),
        ["published-child"],
      );

      const grandchildren = await prisma.$queryRaw<
        Array<{ pageId: string }>
      >(Prisma.sql`
        SELECT parent."pageId"
        FROM "Page" parent
        WHERE parent."websiteId" IN (${Prisma.join(allWebsiteIds)})
          AND parent."parentPageId" IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM "Page" child
            WHERE child."websiteId" = parent."websiteId"
              AND child."state" = parent."state"
              AND child."parentPageId" = parent."pageId"
          )
      `);
      assert.deepEqual(
        new Set(grandchildren.map((row) => row.pageId)),
        new Set(["grand-middle", "cycle-a", "cycle-b"]),
      );

      const cycles = await prisma.$queryRaw<Array<{ originPageId: string }>>(
        Prisma.sql`
          WITH RECURSIVE ancestry AS (
            SELECT page."websiteId", page."state",
              page."pageId" AS "originPageId",
              page."parentPageId" AS "ancestorPageId",
              ARRAY[page."pageId"]::TEXT[] AS path,
              FALSE AS cycle
            FROM "Page" page
            WHERE page."websiteId" IN (${Prisma.join(allWebsiteIds)})
              AND page."parentPageId" IS NOT NULL
            UNION ALL
            SELECT ancestry."websiteId", ancestry."state",
              ancestry."originPageId", parent."parentPageId",
              ancestry.path || parent."pageId",
              parent."pageId" = ANY(ancestry.path)
            FROM ancestry
            JOIN "Page" parent
              ON parent."websiteId" = ancestry."websiteId"
             AND parent."state" = ancestry."state"
             AND parent."pageId" = ancestry."ancestorPageId"
            WHERE ancestry.cycle = FALSE
          )
          SELECT DISTINCT "originPageId" FROM ancestry WHERE cycle = TRUE
        `,
      );
      assert.deepEqual(
        new Set(cycles.map((row) => row.originPageId)),
        new Set(["cycle-a", "cycle-b"]),
      );

      const duplicates = await prisma.$queryRaw<
        Array<{ websiteId: string }>
      >(Prisma.sql`
        SELECT "websiteId"
        FROM "Page"
        WHERE "websiteId" IN (${Prisma.join(allWebsiteIds)})
        GROUP BY "websiteId", "state", "position"
        HAVING COUNT(*) > 1
      `);
      assert.deepEqual(
        duplicates.map((row) => row.websiteId),
        [websiteIds.duplicate],
      );

      const nonSequential = await prisma.$queryRaw<
        Array<{ websiteId: string; pageId: string }>
      >(Prisma.sql`
        WITH ranked AS (
          SELECT "websiteId", "pageId", "position",
            ROW_NUMBER() OVER (
              PARTITION BY "websiteId", "state"
              ORDER BY "position", "createdAt", "id"
            ) - 1 AS "expectedPosition"
          FROM "Page"
          WHERE "websiteId" IN (${Prisma.join(allWebsiteIds)})
        )
        SELECT "websiteId", "pageId" FROM ranked
        WHERE "position" <> "expectedPosition"
      `);
      assert.equal(
        nonSequential.filter(
          (row) => row.websiteId === websiteIds.duplicate,
        ).length,
        1,
      );
      assert.deepEqual(
        nonSequential
          .filter((row) => row.websiteId === websiteIds.gap)
          .map((row) => row.pageId),
        ["gap-b"],
      );

      const rootPagination = await prisma.$queryRaw<
        Array<{ pageId: string }>
      >(Prisma.sql`
        SELECT "pageId" FROM "Page"
        WHERE "websiteId" IN (${Prisma.join(allWebsiteIds)})
          AND "state" = 'draft'
          AND "parentPageId" IS NULL
          AND "paginationEnabled" = TRUE
      `);
      assert.deepEqual(
        rootPagination.map((row) => row.pageId),
        ["paginated-root"],
      );

      const nestedHomes = await prisma.$queryRaw<
        Array<{ pageId: string }>
      >(Prisma.sql`
        SELECT "pageId" FROM "Page"
        WHERE "websiteId" IN (${Prisma.join(allWebsiteIds)})
          AND "slug" = 'home'
          AND "parentPageId" IS NOT NULL
      `);
      assert.deepEqual(
        nestedHomes.map((row) => row.pageId),
        ["home-child"],
      );
    } finally {
      await prisma.website.deleteMany({
        where: { id: { in: allWebsiteIds } },
      });
      await prisma.$disconnect();
    }
  },
);
