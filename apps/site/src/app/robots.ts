/**
 * @file apps/site/src/app/robots.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `robots` (site) — directives d’indexation + lien sitemap.
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
import { resolveTenantFromHost } from "@compoz/site/lib/tenant/resolve-site-tenant";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function parseRobotsTokens(input: unknown): Set<string> {
  const raw = typeof input === "string" ? input : "";
  const tokens = raw
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return new Set(tokens);
}

function hostFromBaseUrl(baseUrl: string): string | undefined {
  const s = stripTrailingSlashes(baseUrl);
  if (!s) return undefined;

  try {
    return new URL(s).host || undefined;
  } catch {
    return undefined;
  }
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export default async function robots(): Promise<MetadataRoute.Robots> {
  // ✅ compat: selon ta version Next, headers() peut être sync ou async
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  const resolved = resolveTenantFromHost({
    hostRaw,
    defaultTenantId: process.env["COMPOZ_DEFAULT_TENANT_ID"],
    tenantByHostJson: process.env["COMPOZ_TENANT_BY_HOST_JSON"],
  });

  const tenantId = resolved.tenantId;

  // Si le resolver tombe en fallback (vercel / host inconnu), on pointe vers /t/:tenant
  const usePathTenantFallback = resolved.kind === "fallback";

  const repo = getSiteRepository({ tenantId });
  const settings = await repo.readSettings(CONTENT_STATE.PUBLISHED);

  const robotsTokens = parseRobotsTokens(settings?.seo?.robots);
  const disallowAll = robotsTokens.has("noindex");

  const baseUrl = stripTrailingSlashes(settings?.seo?.baseUrl) || "";
  const hostOut = hostFromBaseUrl(baseUrl);

  const sitemapPath = usePathTenantFallback
    ? `/t/${encodeURIComponent(tenantId)}/sitemap.xml`
    : "/sitemap.xml";

  const sitemapAbs = baseUrl ? canonicalFromBase(baseUrl, sitemapPath) : null;

  return {
    rules: [
      {
        userAgent: "*",
        allow: disallowAll ? undefined : "/",
        disallow: disallowAll ? "/" : undefined,
      },
    ],
    host: hostOut,
    // ✅ Absolu si baseUrl connu, sinon relatif (dev/debug)
    sitemap: sitemapAbs ?? sitemapPath,
  };
}
