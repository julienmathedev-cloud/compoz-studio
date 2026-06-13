/**
 * @file apps/site/src/app/t/[tenantId]/sitemap.ts
 * @layer site/app/metadata
 *
 * @description
 * Sitemap fallback multi-tenant (route metadata) : `/t/[tenantId]/sitemap.xml`.
 *
 * @remarks
 * - Fallback technique (debug / vercel) : les URLs sont préfixées par `/t/:tenant`.
 * - Base URL :
 *   1) settings.seo.baseUrl (published)
 *   2) NEXT_PUBLIC_SITE_URL
 *   Sinon : URLs relatives (paths).
 */

import "server-only";

import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getSiteRepository } from "@compoz/infra/site";
import { getPublishedPageBySlugByTenantId } from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type Params = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
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

/* -------------------------------------------------------------------------- */
/* Sitemap                                                                    */
/* -------------------------------------------------------------------------- */

export default async function sitemap({
  params,
}: Params): Promise<MetadataRoute.Sitemap> {
  const { tenantId } = await unwrapParams(params);

  const t = requireTenantId(tenantId, "sitemap.tenantId");

  const repo = getSiteRepository({ tenantId: t });
  await repo.ensureBase();

  const [index, settings] = await Promise.all([
    repo.readIndex(CONTENT_STATE.PUBLISHED),
    repo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  if (!index) return notFound();

  const pages = index.pages ?? [];
  const indexLastModified = toLastModified(index.updatedAt) ?? new Date();

  const seoBaseUrl = settings?.seo?.baseUrl ?? "";
  const envBaseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  const baseUrl =
    stripTrailingSlashes(seoBaseUrl) || stripTrailingSlashes(envBaseUrl) || "";

  const entries = await Promise.all(
    pages.map(async (ref) => {
      const slug = toSlug(ref.slug);
      if (!slug) return null;

      const page = await getPublishedPageBySlugByTenantId(t, slug);
      if (!page) return null;

      if (page.sitemap?.include === false) {
        return null;
      }

      const path =
        slug === HOME_SLUG ? `/t/${t}` : `/t/${t}/${encodeURIComponent(slug)}`;

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
