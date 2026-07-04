/**
 * @file packages/infra/src/websites/resolve-studio-website.ts
 * @layer infra/websites
 * @description Prisma-backed Studio active website resolution.
 */

import { prisma } from "@compoz/infra/prisma/prisma-client";

export type StudioWebsiteResolutionSource =
  | "cookie"
  | "user-default"
  | "first-accessible"
  | "fallback";

export type StudioWebsiteResolution = Readonly<{
  websiteId: string;
  slug: string;
  name: string;
  source: StudioWebsiteResolutionSource;
}>;

export type StudioWebsiteResolverUser = Readonly<{
  id: string;
  role: string;
  defaultWebsiteId?: string | null;
  accessibleWebsiteIds: ReadonlyArray<string>;
}>;

const FALLBACK_WEBSITE_SLUG = "demo" as const;

type WebsiteRow = Readonly<{
  id: string;
  slug: string;
  name: string;
}>;

function normalizeId(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizeRole(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeUniqueIds(input: ReadonlyArray<unknown>): string[] {
  return [...new Set(input.map(normalizeId).filter(Boolean))];
}

function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "admin";
}

function toResolution(
  website: WebsiteRow,
  source: StudioWebsiteResolutionSource,
): StudioWebsiteResolution {
  return {
    websiteId: website.id,
    slug: website.slug,
    name: website.name,
    source,
  };
}

async function readSiteById(websiteId: string): Promise<WebsiteRow | null> {
  if (!websiteId) {
    return null;
  }

  return prisma.website.findFirst({
    where: {
      id: websiteId,
      type: "site",
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

async function readFallbackWebsite(): Promise<WebsiteRow | null> {
  return prisma.website.findFirst({
    where: {
      slug: FALLBACK_WEBSITE_SLUG,
      type: "site",
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

function canUseWebsite(args: {
  websiteId: string;
  allowedWebsiteIds: ReadonlyArray<string>;
}): boolean {
  if (!args.websiteId) {
    return false;
  }

  return args.allowedWebsiteIds.includes(args.websiteId);
}

export async function resolveStudioWebsite(args: {
  activeWebsiteId?: string | null;
  user: StudioWebsiteResolverUser;
}): Promise<StudioWebsiteResolution> {
  const allowedWebsiteIds = normalizeUniqueIds(args.user.accessibleWebsiteIds);
  const activeWebsiteId = normalizeId(args.activeWebsiteId);
  const defaultWebsiteId = normalizeId(args.user.defaultWebsiteId);

  if (
    activeWebsiteId &&
    canUseWebsite({
      websiteId: activeWebsiteId,
      allowedWebsiteIds,
    })
  ) {
    const website = await readSiteById(activeWebsiteId);

    if (website) {
      return toResolution(website, "cookie");
    }
  }

  if (
    defaultWebsiteId &&
    canUseWebsite({
      websiteId: defaultWebsiteId,
      allowedWebsiteIds,
    })
  ) {
    const website = await readSiteById(defaultWebsiteId);

    if (website) {
      return toResolution(website, "user-default");
    }
  }

  for (const websiteId of allowedWebsiteIds) {
    const website = await readSiteById(websiteId);

    if (website) {
      return toResolution(website, "first-accessible");
    }
  }

  if (isAdminRole(args.user.role)) {
    const website = await readFallbackWebsite();

    if (website) {
      return toResolution(website, "fallback");
    }
  }

  throw new Error("No accessible Studio website could be resolved.");
}
