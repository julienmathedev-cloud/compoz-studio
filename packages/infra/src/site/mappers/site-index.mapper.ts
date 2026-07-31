/**
 * @file packages/infra/src/site/mappers/site-index.mapper.ts
 * @layer infra/site
 * @description Maps Prisma page rows to the computed SiteIndex domain projection.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

import type {
  DraftPageSummary,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type {
  DraftSiteIndex,
  SiteIndex,
} from "@compoz/core/domain/site/entities/site-index";

export type PrismaSiteIndexPageRow = {
  pageId: string;
  slug: string;
  name: string;
  parentPageId: string | null;
  metaRevision?: number;
  updatedAt: Date;
};

function defaultIndex(_state: ContentState): SiteIndex {
  return { pages: [], updatedAt: "" };
}

function getLatestUpdatedAt(
  pages: ReadonlyArray<PrismaSiteIndexPageRow>,
): Date {
  const [firstPage, ...otherPages] = pages;

  if (!firstPage) {
    throw new Error("Cannot compute latest updatedAt from an empty page list.");
  }

  return otherPages.reduce<Date>((currentLatest, page) => {
    return page.updatedAt > currentLatest ? page.updatedAt : currentLatest;
  }, firstPage.updatedAt);
}

export function toDomainPageSummary(page: PrismaSiteIndexPageRow): PageSummary {
  return {
    id: page.pageId,
    slug: page.slug,
    name: page.name,
    parentId: page.parentPageId,
  };
}

export function toDomainSiteIndex(
  pages: ReadonlyArray<PrismaSiteIndexPageRow>,
  state: ContentState,
): SiteIndex {
  if (pages.length === 0) return defaultIndex(state);

  return {
    pages: pages.map(toDomainPageSummary),
    updatedAt: getLatestUpdatedAt(pages).toISOString(),
  };
}

export function toDomainDraftPageSummary(
  page: PrismaSiteIndexPageRow & { metaRevision: number },
): DraftPageSummary {
  return {
    ...toDomainPageSummary(page),
    metaRevision: page.metaRevision,
  };
}

export function toDomainDraftSiteIndex(
  pages: ReadonlyArray<PrismaSiteIndexPageRow & { metaRevision: number }>,
): DraftSiteIndex {
  if (pages.length === 0) {
    return { pages: [], updatedAt: "" };
  }

  return {
    pages: pages.map(toDomainDraftPageSummary),
    updatedAt: getLatestUpdatedAt(pages).toISOString(),
  };
}
