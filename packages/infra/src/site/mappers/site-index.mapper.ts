/**
 * @file packages/infra/src/site/mappers/site-index.mapper.ts
 * @layer infra/site
 *
 * @description
 * Mapper for the computed SiteIndex domain projection backed by Page rows.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

export type PrismaSiteIndexPageRow = {
  pageId: string;
  slug: string;
  name: string;
  parentPageId: string | null;
  updatedAt: Date;
};

function defaultIndex(state: ContentState): SiteIndex {
  return state === CONTENT_STATE.DRAFT
    ? { pages: [], updatedAt: new Date().toISOString() }
    : { pages: [], updatedAt: "" };
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
