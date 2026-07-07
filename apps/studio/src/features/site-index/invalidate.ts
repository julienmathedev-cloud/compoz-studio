/**
 * @file apps/studio/src/features/site-index/invalidate.ts
 * @layer studio/features/site-index
 *
 * @description
 * React Query helper for invalidating the Studio SiteIndex cache.
 *
 * @remarks
 * - Used after mutations that can change the page index, such as create, reorder, or delete.
 * - The query key is scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 * - `SiteIndex` is the UI read model for pages of the active website.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function invalidateSiteIndex(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
): Promise<void> {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "invalidateSiteIndex.websiteId",
  );

  return queryClient.invalidateQueries({
    queryKey: siteIndexKey(websiteIdKey, state),
  });
}
