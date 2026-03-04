/**
 * @file apps/site/src/app/sitemap.ts
 * @layer app/metadata
 *
 * @description
 * Route metadata `sitemap` (public) — génère le sitemap à partir de l’index publié.
 *
 * ✅ Multi-tenant
 * - Host-based : lvh.me (subdomain) + mapping env
 * - Fallback : si sur *.vercel.app, on génère pour le tenant résolu (souvent default) sous /t/:tenant
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getSiteRepository } from "@compoz/infra/site";
import { resolveTenantFromHost } from "@compoz/site/lib/tenant/resolve-public-tenant";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

function isVercelHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  const resolved = resolveTenantFromHost({
    hostRaw,
    defaultTenantId: process.env["COMPOZ_DEFAULT_TENANT_ID"],
    tenantByHostJson: process.env["COMPOZ_TENANT_BY_HOST_JSON"],
  });

  const tenantId = resolved.tenantId;

  const host = String(resolved.host ?? "")
    .trim()
    .toLowerCase();
  const usePathTenantFallback = host ? isVercelHost(host) : true;

  const siteRepo = getSiteRepository({ tenantId });
  await siteRepo.ensureBase();

  const [index, settings] = await Promise.all([
    siteRepo.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  const pages = index?.pages ?? [];
  const updatedAt = index?.updatedAt;

  const baseUrl =
    stripTrailingSlashes(settings?.seo?.baseUrl) ||
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"]) ||
    "";

  const lastModified =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt)
      : new Date();

  return pages.map((ref) => {
    const slugPath = ref.slug === "home" ? "" : `/${ref.slug}`;

    const finalPath = usePathTenantFallback
      ? ref.slug === "home"
        ? `/t/${tenantId}`
        : `/t/${tenantId}${slugPath}`
      : ref.slug === "home"
        ? "/"
        : slugPath;

    const url = baseUrl
      ? (canonicalFromBase(baseUrl, finalPath) ?? finalPath)
      : finalPath;

    return {
      url,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });
}
