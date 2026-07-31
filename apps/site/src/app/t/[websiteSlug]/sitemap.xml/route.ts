/**
 * @file apps/site/src/app/t/[websiteSlug]/sitemap.xml/route.ts
 * @layer site/app/metadata
 *
 * @description
 * Explicit fallback sitemap.xml route for a public Website slug.
 *
 * @remarks
 * - Resolves the Website from Prisma `Website.slug` before reading published content.
 * - Uses Prisma `Website.id` for repository reads and `Website.slug` for fallback URLs.
 * - Builds sitemap entries from the published SiteIndex and a targeted batch sitemap projection.
 * - Uses the SEO base URL first, then `NEXT_PUBLIC_SITE_URL`, and falls back to relative `/t/:websiteSlug` URLs.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import { loadPublishedSitemapData } from "@compoz/site/lib/sitemap/load-published-sitemap-data";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type RouteContext = Readonly<{
  params:
    | Promise<Readonly<{ websiteSlug: string }>>
    | Readonly<{ websiteSlug: string }>;
}>;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toLastModified(value: string | null | undefined): Date | undefined {
  if (!value || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return new Date(value);
}

/** Builds canonical fallback paths under `/t/:websiteSlug`. */
function fallbackPathForPageSlug(params: {
  websiteSlug: string;
  pageSlug: string;
}): string {
  const { websiteSlug, pageSlug } = params;
  const websitePrefix = `/t/${encodeURIComponent(websiteSlug)}`;

  return pageSlug === HOME_SLUG
    ? websitePrefix
    : `${websitePrefix}/${encodeURIComponent(pageSlug)}`;
}

/** Renders sitemap XML manually so this route can return an explicit XML response. */
function renderSitemap(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lastModified =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : entry.lastModified;

      return [
        "  <url>",
        `    <loc>${escapeXml(String(entry.url))}</loc>`,
        lastModified
          ? `    <lastmod>${escapeXml(String(lastModified))}</lastmod>`
          : "",
        entry.changeFrequency
          ? `    <changefreq>${escapeXml(String(entry.changeFrequency))}</changefreq>`
          : "",
        typeof entry.priority === "number"
          ? `    <priority>${entry.priority}</priority>`
          : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { websiteSlug: websiteSlugParam } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlugParam,
  });

  if (!website) {
    notFound();
  }

  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const { index, settings, pages } = await loadPublishedSitemapData({
    pagesRepository: getPagesRepository({ websiteId }),
    siteRepository: getSiteRepository({ websiteId }),
  });

  if (!index) {
    return new NextResponse(renderSitemap([]), {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }

  const indexLastModified = toLastModified(index.updatedAt) ?? new Date();

  const seoBaseUrl = settings?.seo?.baseUrl ?? "";
  const envBaseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  const baseUrl =
    stripTrailingSlashes(seoBaseUrl) || stripTrailingSlashes(envBaseUrl) || "";

  const entries = await Promise.all(
    pages.map(({ ref, metadata }) => {
      const pageSlug = toSlug(ref.slug);

      if (!pageSlug) {
        return null;
      }

      if (metadata.sitemap?.include === false) {
        return null;
      }

      const path = fallbackPathForPageSlug({
        websiteSlug,
        pageSlug,
      });

      const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

      return {
        url,
        lastModified: toLastModified(metadata.metaUpdatedAt) ?? indexLastModified,
        changeFrequency: metadata.sitemap?.changefreq ?? "weekly",
        priority:
          metadata.sitemap?.priority ?? (pageSlug === HOME_SLUG ? 1 : 0.7),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  return new NextResponse(
    renderSitemap(entries.filter(Boolean) as MetadataRoute.Sitemap),
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
