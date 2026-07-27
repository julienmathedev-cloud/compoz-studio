/**
 * @file apps/studio/src/lib/pages/draft-page-loaders.ts
 * @layer studio/lib/pages
 *
 * @description
 * Server loaders for rendering Studio draft pages.
 *
 * @remarks
 * - Uses React `cache()` to dedupe repository and read calls during the same server render.
 * Resolves the runtime-only Rich Text link context for draft rendering.
 * Portable stored links are remounted under `/draft` by the shared UI resolver.
 */

import "server-only";

import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { getPublishedSiteUrl } from "@compoz/studio/config/siteOrigin";
import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { toSlug } from "@compoz/ui/lib/routing/slug";

type DraftWebsite = Readonly<{
  websiteId: string;
  slug: string;
  name: string;
}>;

export const getWebsite = cache(async (): Promise<DraftWebsite> => {
  const session = await requireSessionWithWebsite();

  return {
    websiteId: session.websiteId,
    slug: session.websiteSlug,
    name: session.websiteName,
  };
});

export const getWebsiteId = cache(async (): Promise<string> => {
  const website = await getWebsite();

  return website.websiteId;
});

const getSiteRepoCached = cache(async (websiteId: string) => {
  return getSiteRepository({ websiteId });
});

const getPagesRepoCached = cache(async (websiteId: string) => {
  return getPagesRepository({ websiteId });
});

const readDraftSettingsCached = cache(async (websiteId: string) => {
  const repository = await getSiteRepoCached(websiteId);

  return repository.readSettings(CONTENT_STATE.DRAFT);
});

const readDraftIndexCached = cache(async (websiteId: string) => {
  const repository = await getSiteRepoCached(websiteId);

  return repository.readIndex(CONTENT_STATE.DRAFT);
});

const readDraftPageByIdCached = cache(
  async (websiteId: string, pageId: string) => {
    const pagesRepository = await getPagesRepoCached(websiteId);

    return pagesRepository.readById(CONTENT_STATE.DRAFT, pageId);
  },
);

async function getDraftPageByResolvedSlugForWebsite(
  websiteId: string,
  slug: string,
) {
  const index = await readDraftIndexCached(websiteId);

  if (!index) {
    return null;
  }

  const pageId = resolvePageIdFromIndex({ slug, index });

  if (!pageId) {
    return null;
  }

  return readDraftPageByIdCached(websiteId, pageId);
}

export async function getDraftSettingsByWebsiteId(websiteId: string) {
  return readDraftSettingsCached(websiteId);
}

/**
 * Resolves runtime-only Rich Text link bases for draft rendering. Portable
 * stored links are remounted under `/draft` by the shared UI resolver.
 */
export const getDraftRichTextLinkContext = cache(
  async (currentPath: string): Promise<RichTextLinkContext> => {
    const website = await getWebsite();
    const settings = await getDraftSettingsByWebsiteId(website.websiteId);
    const publishedSiteUrl = getPublishedSiteUrl({
      websiteSlug: website.slug,
      publishedBaseUrl: settings?.seo?.baseUrl,
    });
    const publishedBase = new URL(publishedSiteUrl);
    return {
      currentPath,
      internalBases: [
        {
          origin: publishedBase.origin,
          mountBase: publishedBase.pathname || "/",
        },
      ],
    };
  },
);

export async function getDraftIndexByWebsiteId(websiteId: string) {
  return readDraftIndexCached(websiteId);
}

export async function getDraftPageBySlugByWebsiteId(
  websiteId: string,
  slug: string,
) {
  const normalizedSlug = toSlug(slug);

  if (!normalizedSlug || normalizedSlug === HOME_SLUG) {
    return null;
  }

  return getDraftPageByResolvedSlugForWebsite(websiteId, normalizedSlug);
}

export async function getDraftHomePageByWebsiteId(websiteId: string) {
  return getDraftPageByResolvedSlugForWebsite(websiteId, HOME_SLUG);
}
