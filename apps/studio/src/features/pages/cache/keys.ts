/**
 * @file apps/studio/src/features/pages/cache/keys.ts
 * @layer studio/features/pages/cache
 *
 * @description
 * React Query key helpers for Studio page caches.
 *
 * @remarks
 * - Prefixes keys with `["w", websiteId, ...]` to avoid cache collisions when switching Website.
 * - Studio page caches are scoped by Prisma Website.id and content state.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

/** Page-by-id cache key used by page and block mutations to seed or patch cached pages. */
export function pageByIdKey(
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
    "byId",
    pageIdKey,
    state,
  ] as const;
}
