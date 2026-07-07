/**
 * @file apps/studio/src/features/pages/blocks/cache/invalidate.ts
 * @layer studio/features/pages/blocks/cache
 *
 * @description
 * React Query helper for invalidating the draft block list cache of a page.
 *
 * @remarks
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 * - Invalidates only the draft block-list query for the given page.
 * - Does not build public URLs, so Website.slug is not involved here.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function invalidateDraftBlocksList(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  if (!websiteIdKey || !pageIdKey) return;

  return queryClient.invalidateQueries({
    queryKey: pageBlocksKey(websiteIdKey, pageIdKey, DEFAULT_CONTENT_STATE),
  });
}
