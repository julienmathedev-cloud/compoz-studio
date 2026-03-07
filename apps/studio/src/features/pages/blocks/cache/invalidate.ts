/**
 * @file apps/studio/src/features/pages/blocks/cache/invalidate.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers React Query pour invalider le cache des blocks d’une page.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

export function invalidateDraftBlocksList(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  const tid = toTenantId(tenantId);
  const pageIdKey = String(pageId ?? "").trim();

  if (!tid || !pageIdKey) return;

  return qc.invalidateQueries({
    queryKey: pageBlocksKey(tid, pageIdKey, DEFAULT_CONTENT_STATE),
  });
}
