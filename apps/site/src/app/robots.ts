/**
 * @file apps/site/src/app/robots.ts
 * @layer site/app/metadata
 *
 * @description
 * Route metadata `robots` du site public — directives d’indexation + lien sitemap.
 *
 * @remarks
 * Multi-website :
 * - Host-based : résolution via WebsiteDomain en Prisma.
 * - Si le host ne correspond à aucun domaine connu, on retourne
 *   des directives robots safe sans sitemap.
 * - Les routes fallback explicites `/t/:websiteSlug` ont leur propre robots dédié.
 */

import "server-only";

import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function parseRobotsTokens(input: string | null | undefined): Set<string> {
  const raw = typeof input === "string" ? input : "";

  const tokens = raw
    .toLowerCase()
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  return new Set(tokens);
}

function hostFromBaseUrl(baseUrl: string): string | undefined {
  const normalizedBaseUrl = stripTrailingSlashes(baseUrl);

  if (!normalizedBaseUrl) {
    return undefined;
  }

  try {
    return new URL(normalizedBaseUrl).host || undefined;
  } catch {
    return undefined;
  }
}

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

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();

  const hostRaw =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  let website: Awaited<ReturnType<typeof resolvePublicWebsiteFromHost>> = null;

  try {
    website = await resolvePublicWebsiteFromHost({ hostRaw });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[site] failed to resolve robots website", error);
    }
  }

  if (!website) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  const websiteId = website.websiteId;

  const repo = getSiteRepository({ websiteId });
  const settings = await repo.readSettings(CONTENT_STATE.PUBLISHED);

  const seo = settings?.seo ?? null;

  const robotsTokens = parseRobotsTokens(seo?.robots ?? null);
  const disallowAll = robotsTokens.has("noindex");

  const seoBaseUrl = stripTrailingSlashes(seo?.baseUrl ?? "");
  const envBaseUrl = stripTrailingSlashes(
    process.env["NEXT_PUBLIC_SITE_URL"] ?? "",
  );
  const requestBaseUrl = resolveRequestBaseUrl(headersList);

  const baseUrl = seoBaseUrl || envBaseUrl || requestBaseUrl;
  const hostOut = baseUrl ? hostFromBaseUrl(baseUrl) : undefined;

  const sitemapPath = "/sitemap.xml";
  const sitemapAbs = baseUrl
    ? canonicalFromBase(baseUrl, sitemapPath)
    : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        ...(disallowAll ? { disallow: "/" } : { allow: "/" }),
      },
    ],
    host: hostOut,
    sitemap: sitemapAbs,
  };
}
