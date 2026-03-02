/**
 * @file apps/studio/src/features/pages/blocks/cache/keys.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux blocks.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export function pageBlocksKey(pageId: string, state: ContentState) {
  const id = (pageId ?? "").trim();
  return ["admin", "pages", "blocks", "byId", id, state] as const;
}
