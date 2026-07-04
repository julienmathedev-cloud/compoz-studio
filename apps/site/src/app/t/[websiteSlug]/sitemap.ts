/**
 * @file apps/site/src/app/t/[websiteSlug]/sitemap.ts
 * @layer site/app/metadata
 *
 * @description
 * Sitemap du fallback public explicite `/t/:websiteSlug/sitemap.xml`.
 *
 * @remarks
 * - Le segment de route `websiteSlug` correspond au Prisma `Website.slug`.
 * - Le Website est résolu via Prisma avant de générer le sitemap.
 * - Les lectures de contenu utilisent le Prisma `Website.id`.
 * - Les URLs générées sont préfixées par `/t/:websiteSlug`.
 *
 * Base URL :
 * 1. `settings.seo.baseUrl` publié.
 * 2. `NEXT_PUBLIC_SITE_URL`.
 * 3. URLs relatives si aucune base URL n’est disponible.
 *
 * Ce sitemap est destiné au fallback technique `/t/:websiteSlug`.
 * Les routes host-based possèdent leur propre sitemap racine `/sitemap.xml`.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import {
  getPublishedHomePageByWebsiteId,
  getPublishedPageBySlugByWebsiteId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type Params = Readonly<{
  params: Promise<Readonly<{ websiteSlug: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toLastModified(value: string | null | undefined): Date | undefined {
  if (!value || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return new Date(value);
}

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

/* -------------------------------------------------------------------------- */
/* Sitemap                                                                    */
/* -------------------------------------------------------------------------- */

export default async function sitemap({
  params,
}: Params): Promise<MetadataRoute.Sitemap> {
  const { websiteSlug: websiteSlugParam } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlugParam,
  });

  if (!website) {
    notFound();
  }

  const websiteId = website.websiteId;
  const websiteSlug = website.slug;

  const repo = getSiteRepository({ websiteId });
  await repo.ensureBase();

  const [index, settings] = await Promise.all([
    repo.readIndex(CONTENT_STATE.PUBLISHED),
    repo.readSettings(CONTENT_STATE.PUBLISHED),
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
      const pageSlug = toSlug(ref.slug);

      if (!pageSlug) {
        return null;
      }

      const page =
        pageSlug === HOME_SLUG
          ? await getPublishedHomePageByWebsiteId(websiteId)
          : await getPublishedPageBySlugByWebsiteId(websiteId, pageSlug);

      if (!page) {
        return null;
      }

      if (page.sitemap?.include === false) {
        return null;
      }

      const path = fallbackPathForPageSlug({
        websiteSlug,
        pageSlug,
      });

      const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

      return {
        url,
        lastModified: toLastModified(page.meta?.updatedAt) ?? indexLastModified,
        changeFrequency: page.sitemap?.changefreq ?? "weekly",
        priority: page.sitemap?.priority ?? (pageSlug === HOME_SLUG ? 1 : 0.7),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  return entries.filter(Boolean) as MetadataRoute.Sitemap;
}
