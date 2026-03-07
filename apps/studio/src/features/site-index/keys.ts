/**
 * @file apps/studio/src/features/site-index/keys.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers pour construire les query keys React Query du SiteIndex.
 *
 * @remarks
 * - Tenant-scoped : la key inclut `tenantId` pour éviter le cache cross-tenant.
 * - Utilisé par `getSiteIndex`, `setSiteIndexCache`, `patchSiteIndexCache`,
 *   et `invalidateSiteIndex`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";

/**
 * Query key React Query du SiteIndex.
 */
export function siteIndexKey(tenantId: unknown, state: ContentState) {
  const tid = requireTenantId(tenantId, "siteIndexKey.tenantId");

  return ["t", tid, "studio", "siteIndex", state] as const;
}
