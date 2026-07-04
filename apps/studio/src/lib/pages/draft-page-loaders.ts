/**
 * @file apps/studio/src/lib/pages/draft-page-loaders.ts
 * @layer studio/lib/pages
 *
 * @description
 * Loaders server Next/React pour le rendu Draft `/draft` dans le Studio :
 * - request-dedupe via `cache()`
 * - résolution slug -> pageId via helpers core
 *
 * @remarks
 * - Le Website actif est résolu via la session Studio.
 * - Les vrais sites utilisent un Prisma Website.id.
 * - Les sessions demo sandbox peuvent encore transporter un scope KV temporaire
 *   explicite via `sandboxTenantId`, mais ce fichier n’expose pas de vocabulaire
 *   tenant générique.
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

/* -------------------------------------------------------------------------- */
/* Website resolution                                                         */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Internal cached loaders                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Core helpers — explicit Website.id                                         */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Public API — explicit Website.id                                           */
/* -------------------------------------------------------------------------- */

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
