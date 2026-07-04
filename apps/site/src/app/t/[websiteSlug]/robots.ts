/**
 * @file apps/site/src/app/t/[websiteSlug]/robots.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `robots` pour le fallback public explicite `/t/:websiteSlug`.
 *
 * @remarks
 * - Le segment de route `websiteSlug` correspond au Prisma `Website.slug`.
 * - Le Website est résolu via Prisma pour éviter d’exposer un fallback inconnu.
 * - On force `noindex` car `/t/:websiteSlug` est un fallback technique,
 *   pas l’URL canonique du site.
 *
 * URL :
 * - `/t/[websiteSlug]/robots.txt`
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
  params: Promise<Readonly<{ websiteSlug: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export default async function robots({
  params,
}: Params): Promise<MetadataRoute.Robots> {
  const { websiteSlug: websiteSlugParam } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlugParam,
  });

  if (!website) {
    notFound();
  }

  const websiteSlug = website.slug;

  const headersList = await headers();

  const baseUrl =
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"] ?? "") ||
    resolveRequestBaseUrl(headersList);

  const sitemapPath = `/t/${encodeURIComponent(websiteSlug)}/sitemap.xml`;

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
