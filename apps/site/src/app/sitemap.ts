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
 * - Uses the published SiteIndex and a targeted batch sitemap projection.
 * - Uses the SEO base URL first, then `NEXT_PUBLIC_SITE_URL`, and falls back to relative paths.
 * - Explicit `/t/:websiteSlug` fallback routes have their own dedicated sitemap route.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import { loadPublishedSitemapData } from "@compoz/site/lib/sitemap/load-published-sitemap-data";
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

  const { index, settings, pages } = await loadPublishedSitemapData({
    pagesRepository: getPagesRepository({ websiteId }),
    siteRepository: getSiteRepository({ websiteId }),
  });

  if (!index) {
    notFound();
  }

  const indexLastModified = toLastModified(index.updatedAt) ?? new Date();

  const seoBaseUrl = settings?.seo?.baseUrl ?? "";
  const envBaseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  const baseUrl =
    stripTrailingSlashes(seoBaseUrl) || stripTrailingSlashes(envBaseUrl) || "";

  const entries = await Promise.all(
    pages.map(({ ref, metadata }) => {
      const slugRaw = String(ref.slug ?? "").trim();
      const slug = slugRaw || HOME_SLUG;

      if (metadata.sitemap?.include === false) {
        return null;
      }

      const path = slug === HOME_SLUG ? "/" : `/${encodeURIComponent(slug)}`;

      const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

      return {
        url,
        lastModified: toLastModified(metadata.metaUpdatedAt) ?? indexLastModified,
        changeFrequency: metadata.sitemap?.changefreq ?? "weekly",
        priority:
          metadata.sitemap?.priority ?? (slug === HOME_SLUG ? 1 : 0.7),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  return entries.filter(Boolean) as MetadataRoute.Sitemap;
}
