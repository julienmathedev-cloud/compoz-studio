/**
 * @file apps/site/src/app/robots.ts
 * @layer app/metadata
 *
 * @description
 * Route metadata `robots` (public) — directives d’indexation + lien sitemap.
 *
 * ✅ Multi-tenant
 * - Host-based : lvh.me (subdomain) + mapping env
 * - Fallback : sur *.vercel.app, sitemap sous /t/:tenant/sitemap.xml
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

function hasToken(s: string | undefined, token: string): boolean {
  return !!s
    ?.toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .includes(token.toLowerCase());
}

function isVercelHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

export default async function robots(): Promise<MetadataRoute.Robots> {
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

  const repo = getSiteRepository({ tenantId });
  const settings = await repo.readSettings(CONTENT_STATE.PUBLISHED);

  const robotsStr = settings?.seo?.robots;
  const baseUrl = stripTrailingSlashes(settings?.seo?.baseUrl) || "";

  const disallowAll = hasToken(robotsStr, "noindex");

  const sitemapPath = usePathTenantFallback
    ? `/t/${tenantId}/sitemap.xml`
    : "/sitemap.xml";

  return {
    rules: [
      {
        userAgent: "*",
        allow: disallowAll ? undefined : "/",
        disallow: disallowAll ? "/" : undefined,
      },
    ],
    host: baseUrl || undefined,
    sitemap: baseUrl ? canonicalFromBase(baseUrl, sitemapPath) : undefined,
  };
}
