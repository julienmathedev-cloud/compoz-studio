/**
 * @file apps/studio/src/config/siteOrigin.ts
 * @layer studio/config
 *
 * @description
 * Helpers for resolving public site URLs from the Studio.
 *
 * @remarks
 * - `NEXT_PUBLIC_SITE_ORIGIN` points to the public site app.
 * - Public fallback URLs use Website.slug through `/t/:websiteSlug`.
 * - `publishedBaseUrl` takes precedence when available.
 */

function trimTrailingSlashes(input: string): string {
  return input.replace(/\/+$/, "");
}

function trimLeadingSlashes(input: string): string {
  return input.replace(/^\/+/, "");
}

export function getSiteOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN;

  if (!origin) {
    return "http://localhost:3001";
  }

  return trimTrailingSlashes(origin);
}

export function getPublishedSiteUrl(args: {
  websiteSlug: string;
  publishedBaseUrl?: string | null;
}): string {
  const websiteSlug = String(args.websiteSlug ?? "")
    .trim()
    .toLowerCase();

  const publishedBaseUrl = String(args.publishedBaseUrl ?? "").trim();

  if (publishedBaseUrl) {
    return trimTrailingSlashes(publishedBaseUrl);
  }

  const origin = getSiteOrigin();

  if (!websiteSlug) {
    return `${origin}/`;
  }

  return `${origin}/t/${encodeURIComponent(trimLeadingSlashes(websiteSlug))}`;
}
