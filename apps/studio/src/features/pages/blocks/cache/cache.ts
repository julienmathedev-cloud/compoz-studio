/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers cache React Query pour les blocks d’une page.
 *
 * @remarks
 * - Les blocks vivent dans `PageDTO`.
 * - Après mutation, la sync est faite via `syncBlocksFromPageCache`,
 *   qui met à jour la page + la liste des blocks.
 * - Le cache Studio est scopé par Prisma Website.id.
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
