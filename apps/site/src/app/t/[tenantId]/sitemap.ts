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
  const updatedAt = index.updatedAt;

  const baseUrl =
    stripTrailingSlashes(settings?.seo?.baseUrl) ||
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"]) ||
    "";

  const lastModified =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt)
      : new Date();

  return pages
    .map((ref) => {
      const slug = toSlug(ref.slug);
      if (!slug) return null;

      const path =
        slug === HOME_SLUG ? `/t/${t}` : `/t/${t}/${encodeURIComponent(slug)}`;

      const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

      return {
        url,
        lastModified,
        changeFrequency: "weekly",
        priority: slug === HOME_SLUG ? 1 : 0.7,
      } satisfies MetadataRoute.Sitemap[number];
    })
    .filter(Boolean) as MetadataRoute.Sitemap;
}
