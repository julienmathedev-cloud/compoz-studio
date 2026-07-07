/**
 * @file apps/studio/src/features/site/status/keys.ts
 * @layer studio/features/site/status
 *
 * @description
 * React Query keys for Website-scoped site status data.
 *
 * @remarks
 * - The `websiteId` segment is Prisma Website.id.
 * - Keys start with `["w", websiteId, ...]` to prevent cache collisions when switching the active website.
 */

import type { SiteStatusDetailsScopeDTO } from "@compoz/core/domain/site/dto";

export function siteStatusKey(websiteId: string) {
  const websiteIdKey = String(websiteId ?? "").trim();

  return ["w", websiteIdKey, "studio", "site", "status"] as const;
}

export function siteStatusDetailsPrefix(websiteId: string) {
  const websiteIdKey = String(websiteId ?? "").trim();

  return ["w", websiteIdKey, "studio", "site", "statusDetails"] as const;
}

export function siteStatusDetailsKey(args: {
  websiteId: string;
  scope: SiteStatusDetailsScopeDTO;
  includeBlocks: boolean;
  pageId?: string | null;
}) {
  const websiteIdKey = String(args.websiteId ?? "").trim();
  const pageId = String(args.pageId ?? "").trim();

  return [
    "w",
    websiteIdKey,
    "studio",
    "site",
    "statusDetails",
    args.scope,
    args.includeBlocks,
    pageId ? pageId : null,
  ] as const;
}

siteStatusKey.displayName = "siteStatusKey";
siteStatusDetailsPrefix.displayName = "siteStatusDetailsPrefix";
siteStatusDetailsKey.displayName = "siteStatusDetailsKey";
