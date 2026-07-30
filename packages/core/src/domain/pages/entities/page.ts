/**
 * @file packages/core/src/domain/pages/entities/page.ts
 * @layer core/domain/pages
 * @description Canonical domain model for content pages.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";

export type SitemapChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface PageMeta {
  createdAt: string;
  updatedAt: string;
}

export interface PageSitemap {
  include: boolean;
  changefreq: SitemapChangeFreq | null;
  priority: number | null;
}

export interface Page {
  id: string;

  /** `null` identifies a root page. */
  parentId: string | null;

  slug: string;

  name: string;

  seoTitle: string | null;

  seoDescription: string | null;

  blocks: ReadonlyArray<Block>;

  meta: PageMeta;

  sitemap: PageSitemap | null;

  /** Runtime invariant: root pages cannot enable pagination. */
  paginationEnabled: boolean;
}

/** Technical revisions attached to a persisted page read. */
export interface PageRevisions {
  metaRevision: number;
  blocksRevision: number;
}

/** Studio-oriented page projection keeping OCC metadata outside editorial data. */
export interface PageWithRevisions {
  page: Page;
  revisions: PageRevisions;
}

export type PageSummary = Pick<Page, "id" | "slug" | "name" | "parentId">;

/** Draft-only page reference carrying the metadata OCC revision. */
export type DraftPageSummary = PageSummary &
  Readonly<{
    metaRevision: number;
  }>;

export type InternalPageOption = Readonly<{
  label: string;

  /** Internal path persisted in `href`, such as `/about` or `/#section`. */
  value: string;

  slug: string;
}>;
