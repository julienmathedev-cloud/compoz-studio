/**
 * @file apps/studio/src/features/site-index/invalidate.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helpers React Query pour invalider le cache du SiteIndex.
 *
 * @remarks
 * - Utilisé après certaines mutations (create / reorder / delete).
 * - Tenant-scoped : la queryKey inclut `tenantId`.
 * - UI-only : aucune logique métier.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { QueryClient } from "@tanstack/react-query";

import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";

/**
 * Invalide le cache du SiteIndex pour un tenant donné.
 */
export function invalidateSiteIndex(
  qc: QueryClient,
  tenantId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
): Promise<void> {
  const tid = requireTenantId(tenantId, "invalidateSiteIndex.tenantId");

  return qc.invalidateQueries({
    queryKey: siteIndexKey(tid, state),
  });
}
