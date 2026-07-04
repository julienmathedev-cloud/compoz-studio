/**
 * @file apps/site/src/app/t/[tenantId]/robots.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `robots` pour le fallback multi-website /t/:websiteSlug.
 *
 * Règle : on force NOINDEX (fallback technique, pas une URL canonique).
 *
 * URL:
 *   /t/[tenantId]/robots.txt
 *
 * @remarks
 * Le segment de route `[tenantId]` est conservé pour éviter un rename Next large,
 * mais sa valeur est maintenant interprétée comme un Website.slug.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type Params = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

function resolveRequestBaseUrl(
  headersList: Awaited<ReturnType<typeof headers>>,
): string {
  const hostRaw =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  const protoRaw =
    headersList.get("x-forwarded-proto") ??
    (hostRaw.includes("localhost") || hostRaw.startsWith("127.0.0.1")
      ? "http"
      : "https");

  const host = hostRaw.trim();

  if (!host) {
    return "";
  }

  return stripTrailingSlashes(`${protoRaw}://${host}`);
}

export default async function robots({
  params,
}: Params): Promise<MetadataRoute.Robots> {
  const { tenantId: websiteSlug } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlug,
  });

  if (!website) {
    return notFound();
  }

  const h = await headers();

  const baseUrl =
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"] ?? "") ||
    resolveRequestBaseUrl(h);

  const sitemapPath = `/t/${encodeURIComponent(website.slug)}/sitemap.xml`;

  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: baseUrl
      ? (canonicalFromBase(baseUrl, sitemapPath) ?? sitemapPath)
      : sitemapPath,
  };
}
