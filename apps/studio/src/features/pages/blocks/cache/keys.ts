/**
 * @file apps/studio/src/features/pages/blocks/cache/keys.ts
 * @layer studio/features/pages/blocks/cache
 *
 * @description
 * React Query key helper for page block list caches.
 *
 * @remarks
 * - Prefixes keys with `["w", websiteId, ...]` to avoid cache collisions when switching Website.
 * - Studio block caches are scoped by Prisma Website.id and content state.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export function pageBlocksKey(
  websiteId: string,
  pageId: string,
  state: ContentState,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  return [
    "w",
    websiteIdKey,
    "studio",
    "pages",
    "blocks",
    "byId",
    pageIdKey,
    state,
  ] as const;
}
