/**
 * @file apps/site/src/app/sitemap.ts
 * @layer site/app/metadata
 *
 * @description
 * Host-based sitemap metadata route for public sites.
 *
 * @remarks
 * - Resolves the active Website from the request host through Prisma WebsiteDomain.
 * - Returns a valid empty sitemap when no Website matches the host.
 * - Uses the published SiteIndex and each published page sitemap settings.
 * - Uses the SEO base URL first, then `NEXT_PUBLIC_SITE_URL`, and falls back to relative paths.
 * - Explicit `/t/:websiteSlug` fallback routes have their own dedicated sitemap route.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import {
  getPublishedHomePageByWebsiteId,
  getPublishedPageBySlugByWebsiteId,
} from "@compoz/site/lib/pages/published-page-loaders";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

/** Converts a stored timestamp into a sitemap `lastModified` date when valid. */
function toLastModified(value: string | null | undefined): Date | undefined {
  if (!value || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return new Date(value);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();

  const hostRaw =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  let website: Awaited<ReturnType<typeof resolvePublicWebsiteFromHost>> = null;

  try {
    website = await resolvePublicWebsiteFromHost({ hostRaw });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[site] failed to resolve sitemap website", error);
    }
  }

  if (!website) {
    return [];
  }

  const websiteId = website.websiteId;

  const siteRepo = getSiteRepository({ websiteId });
  await siteRepo.ensureBase();

  const [index, settings] = await Promise.all([
    siteRepo.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  if (!index) {
    notFound();
  }

  const pages = index.pages ?? [];
  const indexLastModified = toLastModified(index.updatedAt) ?? new Date();

  const seoBaseUrl = settings?.seo?.baseUrl ?? "";
  const envBaseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  const baseUrl =
    stripTrailingSlashes(seoBaseUrl) || stripTrailingSlashes(envBaseUrl) || "";

  const entries = await Promise.all(
    pages.map(async (ref) => {
      const slugRaw = String(ref.slug ?? "").trim();
      const slug = slugRaw || HOME_SLUG;

      const page =
        slug === HOME_SLUG
          ? await getPublishedHomePageByWebsiteId(websiteId)
          : await getPublishedPageBySlugByWebsiteId(websiteId, slug);

      if (!page) {
        return null;
      }

      if (page.sitemap?.include === false) {
        return null;
      }

      const path = slug === HOME_SLUG ? "/" : `/${encodeURIComponent(slug)}`;

      const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

      return {
        url,
        lastModified: toLastModified(page.meta?.updatedAt) ?? indexLastModified,
        changeFrequency: page.sitemap?.changefreq ?? "weekly",
        priority: page.sitemap?.priority ?? (slug === HOME_SLUG ? 1 : 0.7),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  return entries.filter(Boolean) as MetadataRoute.Sitemap;
}
