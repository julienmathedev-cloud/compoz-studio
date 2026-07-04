/**
 * @file apps/studio/src/features/site/status/keys.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Query keys Website-scoped pour le statut du site.
 *
 * @remarks
 * - Le scope utilisé ici est Prisma Website.id.
 * - On préfixe par `["w", websiteId, ...]` pour éviter les collisions
 *   lors d’un switch de Website actif.
 */

import type { SiteStatusDetailsScopeDTO } from "@compoz/core/domain/site/dto";

/** Key SoT Website-scoped. */
export function siteStatusKey(websiteId: string) {
  const websiteIdKey = String(websiteId ?? "").trim();

  return ["w", websiteIdKey, "studio", "site", "status"] as const;
}

/** Key prefix SoT Website-scoped. */
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
