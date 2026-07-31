/**
 * @file apps/studio/src/features/site/status/invalidate.ts
 * @layer studio/features/site/status
 *
 * @description
 * React Query helpers for invalidating site status caches.
 *
 * @remarks
 * - All keys are scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 * - The composite helper invalidates every status view affected by a committed page or block mutation.
 */

import type { QueryClient } from "@tanstack/react-query";

import {
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

export function invalidateSiteStatus(
  queryClient: QueryClient,
  websiteId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: siteStatusKey(websiteId),
  });
}

export function invalidateSiteStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: siteStatusDetailsPrefix(websiteId),
  });
}

/** Invalidates every status view for one website after a committed content write. */
export function invalidateAllSiteStatusViews(
  queryClient: QueryClient,
  websiteId: string,
) {
  return Promise.all([
    invalidateSiteStatus(queryClient, websiteId),
    invalidateSiteStatusDetails(queryClient, websiteId),
  ]);
}
