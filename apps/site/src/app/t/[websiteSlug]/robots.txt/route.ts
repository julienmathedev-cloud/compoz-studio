/**
 * @file apps/site/src/app/t/[websiteSlug]/robots.txt/route.ts
 * @layer site/app/metadata
 *
 * @description
 * Explicit fallback robots.txt route for a public Website slug.
 *
 * @remarks
 * - Resolves the Website from Prisma `Website.slug` before returning metadata.
 * - Disallows indexing for `/t/:websiteSlug` fallback routes so canonical host-based routes remain preferred.
 * - Builds the fallback sitemap URL from `NEXT_PUBLIC_SITE_URL` or the current request host.
 */

import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { resolvePublicWebsiteFromRouteSlug } from "@compoz/infra/websites/resolve-public-website";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

type RouteContext = Readonly<{
  params:
    | Promise<Readonly<{ websiteSlug: string }>>
    | Readonly<{ websiteSlug: string }>;
}>;

/** Reconstructs the public request base URL when no configured site URL is available. */
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

export async function GET(_request: Request, { params }: RouteContext) {
  const { websiteSlug: websiteSlugParam } = await unwrapParams(params);

  const website = await resolvePublicWebsiteFromRouteSlug({
    slug: websiteSlugParam,
  });

  if (!website) {
    notFound();
  }

  const headersList = await headers();
  const baseUrl =
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"] ?? "") ||
    resolveRequestBaseUrl(headersList);

  const sitemapPath = `/t/${encodeURIComponent(website.slug)}/sitemap.xml`;
  const sitemap = baseUrl
    ? (canonicalFromBase(baseUrl, sitemapPath) ?? sitemapPath)
    : sitemapPath;

  return new NextResponse(
    ["User-agent: *", "Disallow: /", "", `Sitemap: ${sitemap}`, ""].join("\n"),
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "text/plain",
      },
    },
  );
}
