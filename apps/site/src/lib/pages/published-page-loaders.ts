/**
 * @file apps/site/src/lib/pages/published-page-loaders.ts
 * @layer site/lib/pages
 *
 * @description
 * Server loaders for published public site pages.
 *
 * @remarks
 * - Centralizes host-based Website resolution in `getWebsite()`.
 * - Resolves the public host through Prisma WebsiteDomain.
 * - Uses React `cache()` to dedupe repository and read calls during the same server render.
 * - Explicit loaders use Prisma Website.id.
 * - Fallback URLs under `/t/:websiteSlug` use Website.slug in dedicated routes.
 */

import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import { toSlug } from "@compoz/ui/lib/routing/slug";

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

async function resolveWebsiteFromRequest() {
  const headersList = await headers();

  const hostRaw =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  const website = await resolvePublicWebsiteFromHost({ hostRaw });

  if (!website) {
    notFound();
  }

  return website;
}

export const getWebsite = cache(resolveWebsiteFromRequest);

export const getWebsiteId = cache(async (): Promise<string> => {
  const website = await getWebsite();
  return website.websiteId;
});

const readPublishedSettingsCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ websiteId });
  return repo.readSettings(CONTENT_STATE.PUBLISHED);
});

const readPublishedIndexCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ websiteId });
  return repo.readIndex(CONTENT_STATE.PUBLISHED);
});

const readPublishedPageByIdCached = cache(
  async (websiteId: string, pageId: string) => {
    const pagesRepo = getPagesRepository({ websiteId });
    return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
  },
);

async function getPublishedPageByResolvedSlugForWebsite(
  websiteId: string,
  slug: string,
) {
  const index = await readPublishedIndexCached(websiteId);

  if (!index) {
    return null;
  }

  const pageId = resolvePageIdFromIndex({ slug, index });

  if (!pageId) {
    return null;
  }

  return readPublishedPageByIdCached(websiteId, pageId);
}

export async function getPublishedSettingsByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return readPublishedSettingsCached(websiteId);
}

export async function getPublishedIndexByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return readPublishedIndexCached(websiteId);
}

export async function getPublishedPageBySlugByWebsiteId(
  websiteIdRaw: string,
  slug: string,
) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  const normalizedSlug = toSlug(slug);

  if (!normalizedSlug || normalizedSlug === HOME_SLUG) {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, normalizedSlug);
}

export async function getPublishedHomePageByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, HOME_SLUG);
}
