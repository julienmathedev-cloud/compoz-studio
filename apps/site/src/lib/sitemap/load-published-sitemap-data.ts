/**
 * @file apps/site/src/lib/sitemap/load-published-sitemap-data.ts
 * @layer site/lib/sitemap
 * @description Loads the lightweight published data required by sitemap routes.
 * @remarks
 * SiteIndex is a Page-row projection. Sitemap metadata is loaded in one scoped
 * batch without reading Page blocks or provisioning a Website.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type {
  PageSitemapMetadata,
  PagesRepository,
} from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

type SitemapPage = Readonly<{
  ref: PageSummary;
  metadata: PageSitemapMetadata;
}>;

type LoadPublishedSitemapDataInput = Readonly<{
  pagesRepository: Pick<PagesRepository, "readManySitemapMetadataById">;
  siteRepository: Pick<SiteRepository, "readIndex" | "readSettings">;
}>;

export type PublishedSitemapData = Readonly<{
  index: SiteIndex;
  settings: SiteSettings;
  pages: ReadonlyArray<SitemapPage>;
}>;

export async function loadPublishedSitemapData({
  pagesRepository,
  siteRepository,
}: LoadPublishedSitemapDataInput): Promise<PublishedSitemapData> {
  const [index, settings] = await Promise.all([
    siteRepository.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepository.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  const metadata = await pagesRepository.readManySitemapMetadataById(
    CONTENT_STATE.PUBLISHED,
    index.pages.map((page) => page.id),
  );

  const pages: SitemapPage[] = [];

  for (const [position, ref] of index.pages.entries()) {
    const pageMetadata = metadata[position];

    if (!pageMetadata) {
      continue;
    }

    pages.push({ ref, metadata: pageMetadata });
  }

  return { index, settings, pages };
}
