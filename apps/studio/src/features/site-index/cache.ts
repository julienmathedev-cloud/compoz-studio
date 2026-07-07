/**
 * @file apps/studio/src/features/site-index/cache.ts
 * @layer studio/features/site-index
 *
 * @description
 * React Query cache helpers for the Studio SiteIndex.
 *
 * @remarks
 * - Allows mutations such as reorder, create, and delete to seed or patch the SiteIndex without a broad invalidation.
 * - Cache entries are scoped by Prisma Website.id to avoid collisions when switching the active website.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function setSiteIndexCache(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  next: SiteIndexDTO,
): void {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "setSiteIndexCache.websiteId",
  );

  queryClient.setQueryData(siteIndexKey(websiteIdKey, state), next);
}

/**
 * Patches the cached SiteIndex without creating a new cache entry when none exists.
 *
 * @remarks
 * - The no-op fallback avoids inventing an incomplete SiteIndex after a mutation response.
 */
export function patchSiteIndexCache(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  patcher: (prev: SiteIndexDTO) => SiteIndexDTO,
): void {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "patchSiteIndexCache.websiteId",
  );

  queryClient.setQueryData(
    siteIndexKey(websiteIdKey, state),
    (prev: SiteIndexDTO | undefined): SiteIndexDTO | undefined => {
      if (!prev) return prev;

      return patcher(prev);
    },
  );
}
