/**
 * @file apps/studio/src/features/site-index/keys.ts
 * @layer studio/features/site-index
 *
 * @description
 * React Query key helpers for the Studio SiteIndex.
 *
 * @remarks
 * - Keys are scoped by Prisma Website.id to avoid cross-website cache collisions when switching the active website.
 * - `SiteIndex` is the UI read model for pages of the active website.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function siteIndexKey(websiteId: unknown, state: ContentState) {
  const websiteIdKey = requireWebsiteId(websiteId, "siteIndexKey.websiteId");

  return ["w", websiteIdKey, "studio", "siteIndex", state] as const;
}
