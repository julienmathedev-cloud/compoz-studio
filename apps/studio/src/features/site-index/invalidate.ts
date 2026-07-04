/**
 * @file apps/studio/src/features/site-index/invalidate.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers React Query pour invalider le cache du SiteIndex.
 *
 * @remarks
 * - Utilisé après certaines mutations create / reorder / delete.
 * - Website-scoped : la queryKey inclut Prisma Website.id.
 * - UI-only : aucune logique métier.
 * - `SiteIndex` désigne ici un read-model UI des pages du Website actif.
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

/**
 * Invalide le cache du SiteIndex pour un Website donné.
 */
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
