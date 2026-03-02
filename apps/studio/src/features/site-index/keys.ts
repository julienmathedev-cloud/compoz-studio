/**
 * @file apps/studio/src/features/site-index/keys.ts
 * @layer hooks/admin/site
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux sites.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export function siteIndexKey(state: ContentState) {
  return ["admin", "siteIndex", state] as const;
}
