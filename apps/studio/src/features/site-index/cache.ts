/**
 * @file apps/studio/src/features/site-index/cache.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers de cache React Query pour le SiteIndex (Studio).
 *
 * @remarks
 * - Permet de seed/patch l’index après une mutation (reorder/create/delete) sans invalidation globale.
 * - `tenantId` est normalisé via `requireTenantId` (anti-collisions de cache).
 * - UI-only : pas de logique métier, uniquement du cache.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Seed (overwrite) le cache SiteIndex.
 */
export function setSiteIndexCache(
  qc: QueryClient,
  tenantId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  next: SiteIndexDTO,
): void {
  const tid = requireTenantId(tenantId, "setSiteIndexCache.tenantId");
  qc.setQueryData(siteIndexKey(tid, state), next);
}

/**
 * Patch le cache SiteIndex via une fonction `patcher`.
 *
 * @remarks
 * - No-op si aucun `prev` en cache (évite de créer un état incohérent).
 */
export function patchSiteIndexCache(
  qc: QueryClient,
  tenantId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  patcher: (prev: SiteIndexDTO) => SiteIndexDTO,
): void {
  const tid = requireTenantId(tenantId, "patchSiteIndexCache.tenantId");

  qc.setQueryData(
    siteIndexKey(tid, state),
    (prev: SiteIndexDTO | undefined): SiteIndexDTO | undefined => {
      if (!prev) return prev;
      return patcher(prev);
    },
  );
}
