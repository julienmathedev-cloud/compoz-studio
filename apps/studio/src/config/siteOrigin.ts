/**
 * @file apps/studio/src/config/siteOrigin.ts
 * @layer studio/config
 *
 * @description
 * Helpers de résolution des URLs publiques depuis le Studio.
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
  tenantId: string;
  publishedBaseUrl?: string | null;
}): string {
  const tenantId = String(args.tenantId ?? "")
    .trim()
    .toLowerCase();
  const publishedBaseUrl = String(args.publishedBaseUrl ?? "").trim();

  if (publishedBaseUrl) {
    return trimTrailingSlashes(publishedBaseUrl);
  }

  const origin = getSiteOrigin();

  if (!tenantId) {
    return `${origin}/`;
  }

  return `${origin}/t/${encodeURIComponent(trimLeadingSlashes(tenantId))}`;
}
