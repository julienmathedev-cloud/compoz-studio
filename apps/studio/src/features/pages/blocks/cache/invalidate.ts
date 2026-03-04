/**
 * @file apps/studio/src/features/pages/blocks/cache/invalidate.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Helpers React Query pour invalider le cache des blocks d’une page.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import type { QueryClient } from "@tanstack/react-query";

export function invalidateDraftBlocksList(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  const tid = String(tenantId ?? "")
    .trim()
    .toLowerCase();

  const id = String(pageId ?? "").trim();

  return qc.invalidateQueries({
    queryKey: pageBlocksKey(tid, id, WRITE_CONTENT_STATE),
  });
}
