/**
 * @file apps/site/src/app/sitemap.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `sitemap` du site public — génère le sitemap à partir de l’index publié.
 *
 * @remarks
 * Multi-website :
 * - Host-based : résolution via WebsiteDomain en Prisma.
 * - Si le host ne correspond à aucun domaine connu, on retourne une 404.
 * - Les routes fallback explicites `/t/:websiteSlug` ont leur propre sitemap dédié.
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
  getPublishedHomePageByTenantId,
  getPublishedPageBySlugByTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

function toLastModified(value: string | null | undefined): Date | undefined {
  if (!value || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return new Date(value);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  const website = await resolvePublicWebsiteFromHost({ hostRaw });

  if (!website) {
    return notFound();
  }

  const websiteId = website.websiteId;

  const siteRepo = getSiteRepository({ tenantId: websiteId });
  await siteRepo.ensureBase();

  const [index, settings] = await Promise.all([
    siteRepo.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  if (!index) {
    return notFound();
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
          ? await getPublishedHomePageByTenantId(websiteId)
          : await getPublishedPageBySlugByTenantId(websiteId, slug);

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
