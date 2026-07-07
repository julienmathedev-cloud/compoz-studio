/**
 * @file apps/studio/src/lib/pages/draft-page-loaders.ts
 * @layer studio/lib/pages
 *
 * @description
 * Server loaders for rendering Studio draft pages.
 *
 * @remarks
 * - Uses React `cache()` to dedupe repository and read calls during the same server render.
 * - Resolves slugs to page ids through the core SiteIndex helpers.
 * - The active website is resolved from the Studio session and uses Prisma Website.id.
 * - Demo sandbox sessions may still carry an explicit temporary KV scope through `sandboxTenantId`, but this module should not expose generic tenant wording.
 */

import "server-only";

import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
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
