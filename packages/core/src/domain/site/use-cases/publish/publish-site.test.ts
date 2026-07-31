/**
 * @file packages/core/src/domain/site/use-cases/publish/publish-site.test.ts
 * @layer core/domain/site/use-cases/publish
 * @description Tests post-commit public revalidation behavior.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  PublishSiteTransaction,
  PublishSiteTransactionContext,
} from "@compoz/core/domain/site/ports/publish-site-transaction";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import { publishSite } from "@compoz/core/domain/site/use-cases/publish/publish-site";

const index = {
  pages: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
} as const;

const settings = {
  header: DEFAULT_HEADER_SETTINGS,
  footer: DEFAULT_FOOTER_SETTINGS,
  primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
  legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
  social: DEFAULT_SOCIAL_SETTINGS,
  identity: DEFAULT_IDENTITY_SETTINGS,
  seo: DEFAULT_SEO_SETTINGS,
  theme: DEFAULT_THEME_SETTINGS,
} as const;

function createContext(params?: {
  draftIndex?: SiteIndex;
  publishedIndex?: SiteIndex;
  draftPages?: Array<Page | null>;
  onReplacePublishedSnapshot?: () => void;
}): PublishSiteTransactionContext {
  const site = {
    readIndex: async (state: string) =>
      state === CONTENT_STATE.PUBLISHED
        ? (params?.publishedIndex ?? index)
        : (params?.draftIndex ?? index),
    readSettings: async () => settings,
  } satisfies Pick<SiteRepository, "readIndex" | "readSettings">;
  const pages = {
    readManyById: async () => params?.draftPages ?? [],
  } satisfies Pick<PagesRepository, "readManyById">;

  return {
    site: site as unknown as SiteRepository,
    pages: pages as unknown as PagesRepository,
    replacePublishedSnapshot: async () => {
      params?.onReplacePublishedSnapshot?.();
    },
  };
}

class InternallyRetriedTransaction implements PublishSiteTransaction {
  runCalls = 0;
  operationCalls = 0;

  async run<T>(
    operation: (context: PublishSiteTransactionContext) => Promise<T>,
  ): Promise<T> {
    this.runCalls += 1;

    this.operationCalls += 1;
    await operation(createContext());

    this.operationCalls += 1;
    return operation(createContext());
  }
}

class RejectedTransaction implements PublishSiteTransaction {
  runCalls = 0;
  operationCalls = 0;

  async run<T>(
    _operation: (context: PublishSiteTransactionContext) => Promise<T>,
  ): Promise<T> {
    this.runCalls += 1;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      this.operationCalls += 1;
      await _operation(createContext());
    }

    throw new DomainError({
      code: ERROR_CODES.PUBLISH_CONFLICT,
      details: {
        operation: "publish_site",
        attempts: 3,
        conflictKind: "P2034",
      },
    });
  }
}

void test("revalidates exactly once after an internally retried transaction commits", async () => {
  const transaction = new InternallyRetriedTransaction();
  let revalidationCalls = 0;
  const run = publishSite({
    transaction,
    runtime: { isProd: false },
    revalidator: {
      async revalidatePublished() {
        revalidationCalls += 1;
      },
    },
  });

  const result = await run({
    from: CONTENT_STATE.DRAFT,
    to: CONTENT_STATE.PUBLISHED,
  });

  assert.equal(transaction.runCalls, 1);
  assert.equal(transaction.operationCalls, 2);
  assert.equal(result.pagesCopied, 0);
  assert.equal(revalidationCalls, 1);
});

void test("does not revalidate when the publication transaction rejects", async () => {
  const transaction = new RejectedTransaction();
  let revalidationCalls = 0;
  const run = publishSite({
    transaction,
    runtime: { isProd: false },
    revalidator: {
      async revalidatePublished() {
        revalidationCalls += 1;
      },
    },
  });

  await assert.rejects(run(), (error) => {
    assert.equal(error instanceof DomainError, true);
    if (!(error instanceof DomainError)) return false;
    assert.equal(error.code, ERROR_CODES.PUBLISH_CONFLICT);
    return true;
  });

  assert.equal(transaction.runCalls, 1);
  assert.equal(transaction.operationCalls, 3);
  assert.equal(revalidationCalls, 0);
});

void test("keeps the committed publication result when revalidation fails", async () => {
  let replaceCalls = 0;
  let revalidationCalls = 0;
  const transaction: PublishSiteTransaction = {
    async run<T>(operation: (context: PublishSiteTransactionContext) => Promise<T>) {
      return operation(createContext({
        onReplacePublishedSnapshot: () => {
          replaceCalls += 1;
        },
      }));
    },
  };
  const run = publishSite({
    transaction,
    runtime: { isProd: false },
    revalidator: {
      async revalidatePublished() {
        revalidationCalls += 1;
        throw new DomainError({ code: ERROR_CODES.INTERNAL });
      },
    },
  });

  const result = await run();

  assert.equal(replaceCalls, 1);
  assert.equal(revalidationCalls, 1);
  assert.equal(result.pagesCopied, 0);
  assert.equal(result.settingsCopied, true);
  assert.equal(
    result.warnings.filter(
      (warning) => warning.code === ERROR_CODES.PUBLISH_REVALIDATION_FAILED,
    ).length,
    1,
  );
});

void test("revalidates the deduplicated union of previous and new published slugs", async () => {
  const draftIndex: SiteIndex = {
    pages: [{ id: "new-page", slug: "new", name: "New", parentId: null }],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const publishedIndex: SiteIndex = {
    pages: [
      { id: "old-page", slug: "old", name: "Old", parentId: null },
      { id: "new-page", slug: "new", name: "New", parentId: null },
    ],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const draftPage: Page = {
    id: "new-page",
    parentId: null,
    slug: "new",
    name: "New",
    seoTitle: null,
    seoDescription: null,
    blocks: [],
    meta: {
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    sitemap: null,
    paginationEnabled: false,
  };
  let revalidatedSlugs: ReadonlyArray<string> = [];
  const transaction: PublishSiteTransaction = {
    async run<T>(operation: (context: PublishSiteTransactionContext) => Promise<T>) {
      return operation(createContext({
        draftIndex,
        publishedIndex,
        draftPages: [draftPage],
      }));
    },
  };
  const run = publishSite({
    transaction,
    runtime: { isProd: false },
    revalidator: {
      async revalidatePublished({ slugs }) {
        revalidatedSlugs = slugs;
      },
    },
  });

  await run();

  assert.deepEqual(revalidatedSlugs, ["old", "new"]);
});
