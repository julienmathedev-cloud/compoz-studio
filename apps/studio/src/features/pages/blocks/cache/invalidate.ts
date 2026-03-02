/**
 * @file apps/studio/src/features/pages/blocks/cache/invalidate.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Helpers React Query pour invalider le cache des blocks d’une page.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { QueryClient } from "@tanstack/react-query";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function invalidateDraftBlocksList(qc: QueryClient, pageId: string) {
  const id = (pageId ?? "").trim();
  return qc.invalidateQueries({
    queryKey: pageBlocksKey(id, WRITE_CONTENT_STATE),
  });
}
