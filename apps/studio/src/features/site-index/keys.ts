/**
 * @file apps/studio/src/features/site-index/keys.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers pour construire les query keys React Query du SiteIndex.
 *
 * @remarks
 * - Website-scoped : la key inclut Prisma Website.id pour éviter le cache
 *   cross-website lors d’un switch de Website actif.
 * - Utilisé par `getSiteIndex`, `setSiteIndexCache`, `patchSiteIndexCache`
 *   et `invalidateSiteIndex`.
 * - `SiteIndex` désigne ici un read-model UI des pages du Website actif.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

/**
 * Query key React Query du SiteIndex.
 */
export function siteIndexKey(websiteId: unknown, state: ContentState) {
  const websiteIdKey = requireWebsiteId(websiteId, "siteIndexKey.websiteId");

  return ["w", websiteIdKey, "studio", "siteIndex", state] as const;
}
