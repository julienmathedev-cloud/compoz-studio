/**
 * @file packages/infra/src/websites/resolve-public-website.ts
 * @layer infra/websites
 * @description Prisma-backed public website resolution from hosts and explicit route slugs.
 * @remarks
 * Public resolution is strict for SEO: unknown hosts or slugs return `null` instead of falling back to demo.
 */

import { prisma } from "@compoz/infra/prisma/prisma-client";

export type PublicWebsiteResolutionSource = "domain" | "route";

export type PublicWebsiteResolution = Readonly<{
  websiteId: string;
  slug: string;
  name: string;
  source: PublicWebsiteResolutionSource;
  host?: string;
}>;

type WebsiteRow = Readonly<{
  id: string;
  slug: string;
  name: string;
}>;

function normalizeLower(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeWebsiteHost(raw: unknown): string {
  const host = normalizeLower(raw);

  if (!host) {
    return "";
  }

  /** Keep bracketed IPv6 hosts intact instead of splitting on `:`. */
  if (host.startsWith("[")) {
    const end = host.indexOf("]");

    if (end >= 0) {
      return host.slice(0, end + 1);
    }

    return host;
  }

  const noPort = host.includes(":") ? host.split(":")[0] : host;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

function toResolution(args: {
  website: WebsiteRow;
  source: PublicWebsiteResolutionSource;
  host?: string;
}): PublicWebsiteResolution {
  return {
    websiteId: args.website.id,
    slug: args.website.slug,
    name: args.website.name,
    source: args.source,
    ...(args.host ? { host: args.host } : {}),
  };
}

export async function resolvePublicWebsiteFromHost(args: {
  hostRaw?: string | null;
}): Promise<PublicWebsiteResolution | null> {
  const host = normalizeWebsiteHost(args.hostRaw);

  if (!host) {
    return null;
  }

  const domain = await prisma.websiteDomain.findUnique({
    where: {
      host,
    },
    select: {
      website: {
        select: {
          id: true,
          slug: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (domain?.website.type !== "site") {
    return null;
  }

  return toResolution({
    website: domain.website,
    source: "domain",
    host,
  });
}

export async function resolvePublicWebsiteFromRouteSlug(args: {
  slug?: string | null;
}): Promise<PublicWebsiteResolution | null> {
  const slug = normalizeLower(args.slug);

  if (!slug) {
    return null;
  }

  const website = await prisma.website.findFirst({
    where: {
      slug,
      type: "site",
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!website) {
    return null;
  }

  return toResolution({
    website,
    source: "route",
  });
}
