/**
 * @file apps/site/src/app/t/[tenantId]/robots.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `robots` pour le fallback multi-tenant /t/:tenant.
 *
 * Règle : on force NOINDEX (fallback technique, pas une URL canonique).
 *
 * URL:
 *   /t/[tenantId]/robots.txt
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toTenantId } from "@compoz/ui/lib/tenant-id";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type Params = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

function resolveRequestBaseUrl(
  headersList: Awaited<ReturnType<typeof headers>>,
) {
  const hostRaw =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  const protoRaw =
    headersList.get("x-forwarded-proto") ??
    (hostRaw.includes("localhost") || hostRaw.startsWith("127.0.0.1")
      ? "http"
      : "https");

  const host = hostRaw.trim();

  if (!host) return "";

  return stripTrailingSlashes(`${protoRaw}://${host}`);
}

export default async function robots({
  params,
}: Params): Promise<MetadataRoute.Robots> {
  const { tenantId } = await unwrapParams(params);

  const t = toTenantId(tenantId);
  const h = await headers();

  const baseUrl =
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"] ?? "") ||
    resolveRequestBaseUrl(h);

  const sitemapPath = t ? `/t/${t}/sitemap.xml` : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap:
      sitemapPath && baseUrl
        ? (canonicalFromBase(baseUrl, sitemapPath) ?? sitemapPath)
        : sitemapPath,
  };
}
