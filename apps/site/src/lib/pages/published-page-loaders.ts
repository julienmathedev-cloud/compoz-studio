/**
 * @file apps/site/src/lib/pages/published-page-loaders.ts
 * @layer site/lib/pages
 *
 * @description
 * Server loaders for published public site pages.
 *
 * @remarks
 * - Centralizes host-based Website resolution in `getWebsite()`.
 * - Resolves the public host through Prisma WebsiteDomain.
 * - Uses React `cache()` to dedupe repository and read calls during the same server render.
 * - Explicit loaders use Prisma Website.id.
 * - Fallback URLs under `/t/:websiteSlug` use Website.slug in dedicated routes.
 */

import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import { resolveSiteMountBase } from "@compoz/ui/lib/links/helpers";
import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { toSlug } from "@compoz/ui/lib/routing/slug";

type RequestContext = Readonly<{
  host: string | undefined;
  origin: string | undefined;
}>;

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

/** Returns the first value from a potentially comma-separated proxy header. */
function getFirstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim() ?? "";
}

/** Detects local hosts that should use HTTP when no proxy protocol is provided. */
function isLocalRequestHost(host: string): boolean {
  const normalizedHost = host.toLowerCase();

  return (
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("localhost:") ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.startsWith("127.0.0.1:") ||
    normalizedHost === "[::1]" ||
    normalizedHost.startsWith("[::1]:")
  );
}

/**
 * Reads the request host and origin once per server render.
 *
 * The host remains available for Website resolution even when the protocol
 * or origin cannot be safely determined.
 */
const getRequestContext = cache(async (): Promise<RequestContext> => {
  const headersList = await headers();

  const host = getFirstHeaderValue(
    headersList.get("x-forwarded-host") ?? headersList.get("host"),
  );

  if (!host) {
    return {
      host: undefined,
      origin: undefined,
    };
  }

  const forwardedProtocol = getFirstHeaderValue(
    headersList.get("x-forwarded-proto"),
  ).toLowerCase();

  const protocol =
    forwardedProtocol || (isLocalRequestHost(host) ? "http" : "https");

  if (protocol !== "http" && protocol !== "https") {
    return {
      host,
      origin: undefined,
    };
  }

  try {
    const url = new URL(`${protocol}://${host}`);

    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return {
        host,
        origin: undefined,
      };
    }

    return {
      host,
      origin: url.origin,
    };
  } catch {
    return {
      host,
      origin: undefined,
    };
  }
});

async function resolveWebsiteFromRequest() {
  const requestContext = await getRequestContext();

  if (!requestContext.host) {
    notFound();
  }

  const website = await resolvePublicWebsiteFromHost({
    hostRaw: requestContext.host,
  });

  if (!website) {
    notFound();
  }

  return website;
}

export const getWebsite = cache(resolveWebsiteFromRequest);

/** Returns the request origin used by the hosted and fallback public renderers. */
export const getRequestOrigin = cache(async (): Promise<string | undefined> => {
  const requestContext = await getRequestContext();
  return requestContext.origin;
});

function toCanonicalLinkBase(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return {
      origin: url.origin,
      mountBase: url.pathname || "/",
    };
  } catch {
    return null;
  }
}

/**
 * Builds the runtime-only context that maps portable Rich Text hrefs to the
 * currently rendered public or fallback site mount.
 */
export async function getPublishedRichTextLinkContext(args: {
  currentPath: string;
  canonicalBaseUrl?: string | null;
}): Promise<RichTextLinkContext> {
  const requestOrigin = await getRequestOrigin();
  const currentMountBase = resolveSiteMountBase(args.currentPath);
  const canonicalBase = toCanonicalLinkBase(args.canonicalBaseUrl);
  const canUseCanonicalBase =
    canonicalBase !== null &&
    (requestOrigin === undefined ||
      canonicalBase.origin !== requestOrigin ||
      currentMountBase === "/" ||
      canonicalBase.mountBase === currentMountBase);

  return {
    currentPath: args.currentPath,
    internalBases: [
      ...(requestOrigin
        ? [{ origin: requestOrigin, mountBase: currentMountBase }]
        : []),
      ...(canUseCanonicalBase && canonicalBase ? [canonicalBase] : []),
    ],
  };
}

export const getWebsiteId = cache(async (): Promise<string> => {
  const website = await getWebsite();
  return website.websiteId;
});

const readPublishedSettingsCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ websiteId });
  return repo.readSettings(CONTENT_STATE.PUBLISHED);
});

const readPublishedIndexCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ websiteId });
  return repo.readIndex(CONTENT_STATE.PUBLISHED);
});

const readPublishedPageByIdCached = cache(
  async (websiteId: string, pageId: string) => {
    const pagesRepo = getPagesRepository({ websiteId });
    return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
  },
);

async function getPublishedPageByResolvedSlugForWebsite(
  websiteId: string,
  slug: string,
) {
  const index = await readPublishedIndexCached(websiteId);

  if (!index) {
    return null;
  }

  const pageId = resolvePageIdFromIndex({ slug, index });

  if (!pageId) {
    return null;
  }

  return readPublishedPageByIdCached(websiteId, pageId);
}

export async function getPublishedSettingsByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return readPublishedSettingsCached(websiteId);
}

export async function getPublishedIndexByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return readPublishedIndexCached(websiteId);
}

export async function getPublishedPageBySlugByWebsiteId(
  websiteIdRaw: string,
  slug: string,
) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  const normalizedSlug = toSlug(slug);

  if (!normalizedSlug || normalizedSlug === HOME_SLUG) {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, normalizedSlug);
}

export async function getPublishedHomePageByWebsiteId(websiteIdRaw: string) {
  const websiteId = normalizeId(websiteIdRaw);

  if (!websiteId) {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, HOME_SLUG);
}
