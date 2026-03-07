/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.ts
 * @layer hooks/studio/pages/blocks
 * @description
 * Helpers cache React Query pour les blocks d’une page (liste).
 *
 * @remarks
 * - Les blocks vivent dans `PageDTO`.
 * - Après mutation, la sync est faite via `syncBlocksFromPageCache`
 *   (qui met à jour la page + la liste des blocks).
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function setPageBlocksCache(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  state: ContentState,
  next: ReadonlyArray<BlockDTO>,
) {
  qc.setQueryData(pageBlocksKey(tenantId, pageId, state), next);
}

export function patchPageBlocksCache(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  state: ContentState,
  patcher: (prev: ReadonlyArray<BlockDTO>) => ReadonlyArray<BlockDTO>,
) {
  qc.setQueryData(
    pageBlocksKey(tenantId, pageId, state),
    (prev: ReadonlyArray<BlockDTO> | undefined) => {
      if (!prev) return prev;
      return patcher(prev);
    },
  );
}

export function removePageBlocksCache(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  state: ContentState,
) {
  qc.removeQueries({
    queryKey: pageBlocksKey(tenantId, pageId, state),
    exact: true,
  });
}
