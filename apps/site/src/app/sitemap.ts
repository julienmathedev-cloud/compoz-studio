/**
 * @file apps/site/src/app/sitemap.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `sitemap` (site) — génère le sitemap à partir de l’index publié.
 *
 * ✅ Multi-tenant
 * - Host-based : lvh.me (subdomain) + mapping env
 * - Fallback : si sur *.vercel.app, on génère pour le tenant résolu (souvent default) sous /t/:tenant
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getSiteRepository } from "@compoz/infra/site";
import { resolveTenantFromHost } from "@compoz/site/lib/tenant/resolve-site-tenant";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  const resolved = resolveTenantFromHost({
    hostRaw,
    defaultTenantId: process.env["COMPOZ_DEFAULT_TENANT_ID"],
    tenantByHostJson: process.env["COMPOZ_TENANT_BY_HOST_JSON"],
  });

  const tenantId = resolved.tenantId;
  const usePathTenantFallback = resolved.kind === "fallback";

  const siteRepo = getSiteRepository({ tenantId });
  await siteRepo.ensureBase();

  const [index, settings] = await Promise.all([
    siteRepo.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  const pages = index?.pages ?? [];
  const updatedAt = index?.updatedAt;

  const seoBaseUrl = settings?.seo?.baseUrl ?? "";
  const envBaseUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  const baseUrl =
    stripTrailingSlashes(seoBaseUrl) || stripTrailingSlashes(envBaseUrl) || "";

  const indexLastModified =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt)
      : new Date();

  const entries = await Promise.all(
    pages.map(async (ref) => {
      const slugRaw = String(ref.slug ?? "").trim();
      const slug = slugRaw ? slugRaw : HOME_SLUG;

      const page = await siteRepo.readPage(slug, CONTENT_STATE.PUBLISHED);
      if (!page) return null;

      if (page.sitemap?.include === false) {
        return null;
      }

      const slugPath = slug === HOME_SLUG ? "" : `/${encodeURIComponent(slug)}`;

      const finalPath = usePathTenantFallback
        ? slug === HOME_SLUG
          ? `/t/${encodeURIComponent(tenantId)}`
          : `/t/${encodeURIComponent(tenantId)}${slugPath}`
        : slug === HOME_SLUG
          ? "/"
          : slugPath;

      const url = baseUrl
        ? (canonicalFromBase(baseUrl, finalPath) ?? finalPath)
        : finalPath;

      const pageUpdatedAt = page.meta?.updatedAt;
      const lastModified =
        pageUpdatedAt && !Number.isNaN(Date.parse(pageUpdatedAt))
          ? new Date(pageUpdatedAt)
          : indexLastModified;

      return {
        url,
        lastModified,
        changeFrequency: page.sitemap?.changefreq ?? "weekly",
        priority: page.sitemap?.priority ?? (slug === HOME_SLUG ? 1 : 0.7),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  return entries.filter(Boolean) as MetadataRoute.Sitemap;
}
