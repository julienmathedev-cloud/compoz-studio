/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.ts
 * @layer hooks/admin/pages/blocks
 * @description
 * Helpers cache React Query pour les blocks d’une page (liste).
 *
 * Note:
 * - Les blocks vivent dans PageDTO.
 * - Après mutation, on sync via `syncBlocksFromPageCache` (qui met à jour page + liste blocks).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { QueryClient } from "@tanstack/react-query";

import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function setPageBlocksCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
  next: ReadonlyArray<BlockDTO>,
) {
  qc.setQueryData(pageBlocksKey(pageId, state), next);
}

export function patchPageBlocksCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
  patcher: (prev: ReadonlyArray<BlockDTO>) => ReadonlyArray<BlockDTO>,
) {
  qc.setQueryData(
    pageBlocksKey(pageId, state),
    (prev: ReadonlyArray<BlockDTO> | undefined) => {
      if (!prev) return prev;
      return patcher(prev);
    },
  );
}

export function removePageBlocksCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
) {
  qc.removeQueries({ queryKey: pageBlocksKey(pageId, state), exact: true });
}
