/**
 * @file packages/core/src/domain/pages/use-cases/update-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for updating a page through a controlled patch.
 */

import type {
  Page,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/** Optional fields are patch fields; `seoTitle`, `seoDescription`, and `sitemap` can explicitly reset to `null`. */
export type UpdatePageInput = {
  pageId: string;
  name?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string;
  parentId?: string | null;
  sitemap?: Partial<PageSitemap> | null;
  paginationEnabled?: boolean;
};

export interface UpdatePageResult {
  page: Page;
}

export interface UpdatePageDeps {
  pages: PagesRepository;

  /** Optional site repository used to update menu hrefs after a slug rename. */
  site?: SiteRepository;

  nowIso?: () => string;
}

export type ChangedKey = keyof Pick<
  Page,
  | "name"
  | "slug"
  | "parentId"
  | "sitemap"
  | "paginationEnabled"
  | "seoTitle"
  | "seoDescription"
>;
