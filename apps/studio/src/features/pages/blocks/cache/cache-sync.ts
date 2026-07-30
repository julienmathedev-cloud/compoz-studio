/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.ts
 * @layer studio/features/pages/blocks/cache
 *
 * @description
 * Synchronizes React Query caches after a block mutation returns an updated page.
 *
 * @remarks
 * - Updates both the page-by-id cache and the derived page blocks cache.
 * - Studio caches are scoped by Prisma Website.id and content state.
 * - Does not build public URLs, so Website.slug is not involved here.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  PageDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import { setPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function syncBlocksFromPageCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  page: PageDTO,
  state: ContentState = DEFAULT_CONTENT_STATE,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  if (!websiteIdKey || !pageIdKey) return;

  queryClient.setQueryData(
    pageByIdKey(websiteIdKey, pageIdKey, state),
    (current: PageWithRevisionsDTO | undefined) =>
      current
        ? {
            ...current,
            page: {
              ...current.page,
              blocks: page.blocks,
            },
          }
        : current,
  );

  setPageBlocksCache(
    queryClient,
    websiteIdKey,
    pageIdKey,
    state,
    page.blocks ?? [],
  );
}
