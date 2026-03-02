/**
 * @file apps/studio/src/features/site-index/cache.ts
 * @layer hooks/admin/site
 *
 * @description
 * Helpers de cache React Query pour le SiteIndex.
 *
 * @remarks
 * - Permet d’updater l’index après une mutation (reorder/create/delete) sans invalidation globale.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import type { QueryClient } from "@tanstack/react-query";

export function setSiteIndexCache(
  qc: QueryClient,
  state: ContentState = WRITE_CONTENT_STATE,
  next: SiteIndexDTO,
) {
  qc.setQueryData(siteIndexKey(state), next);
}

export function patchSiteIndexCache(
  qc: QueryClient,
  state: ContentState = WRITE_CONTENT_STATE,
  patcher: (prev: SiteIndexDTO) => SiteIndexDTO,
) {
  qc.setQueryData(siteIndexKey(state), (prev: SiteIndexDTO | undefined) => {
    if (!prev) return prev;
    return patcher(prev);
  });
}
