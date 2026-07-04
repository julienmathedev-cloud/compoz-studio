/**
 * @file apps/studio/src/features/site-index/cache.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers de cache React Query pour le SiteIndex Studio.
 *
 * @remarks
 * - Permet de seed/patch l’index après une mutation reorder/create/delete
 *   sans invalidation globale.
 * - Le cache est scopé par Prisma Website.id pour éviter les collisions.
 * - UI-only : pas de logique métier, uniquement du cache.
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

/**
 * Seed, overwrite le cache SiteIndex.
 */
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
 * Patch le cache SiteIndex via une fonction `patcher`.
 *
 * @remarks
 * - No-op si aucun `prev` en cache pour éviter de créer un état incohérent.
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
