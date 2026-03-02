/**
 * @file apps/studio/src/features/site-index/invalidate.ts
 * @layer hooks/admin/site
 * @description
 * Helpers React Query pour invalider et manipuler le cache du site.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import type { QueryClient } from "@tanstack/react-query";

export function invalidateSiteIndex(
  qc: QueryClient,
  state: ContentState = WRITE_CONTENT_STATE,
) {
  return qc.invalidateQueries({ queryKey: siteIndexKey(state) });
}
