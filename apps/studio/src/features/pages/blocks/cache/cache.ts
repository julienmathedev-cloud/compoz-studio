/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.ts
 * @layer studio/features/pages/blocks/cache
 *
 * @description
 * React Query cache helpers for blocks stored inside a page.
 *
 * @remarks
 * - Blocks live inside `PageDTO`; this cache exposes the derived block list.
 * - Block mutations are synchronized through `syncBlocksFromPageCache`, which updates both page and block-list caches.
 * - Studio caches are scoped by Prisma Website.id and content state.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function setPageBlocksCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState,
  next: ReadonlyArray<BlockDTO>,
) {
  queryClient.setQueryData(pageBlocksKey(websiteId, pageId, state), next);
}

export function patchPageBlocksCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState,
  patcher: (prev: ReadonlyArray<BlockDTO>) => ReadonlyArray<BlockDTO>,
) {
  queryClient.setQueryData(
    pageBlocksKey(websiteId, pageId, state),
    (prev: ReadonlyArray<BlockDTO> | undefined) => {
      if (!prev) return prev;

      return patcher(prev);
    },
  );
}

export function removePageBlocksCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState,
) {
  queryClient.removeQueries({
    queryKey: pageBlocksKey(websiteId, pageId, state),
    exact: true,
  });
}
