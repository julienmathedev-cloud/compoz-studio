/**
 * @file apps/studio/src/features/pages/blocks/cache/cache.ts
 * @layer studio/features/pages/blocks/cache
 * @description Monotone revisioned Page block snapshot cache helpers.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function adoptPageBlocksSnapshot(
  current: PageBlocksSnapshotDTO | undefined,
  incoming: PageBlocksSnapshotDTO,
  authoritative = false,
): PageBlocksSnapshotDTO {
  if (!current) return incoming;
  return incoming.blocksRevision > current.blocksRevision ||
    (authoritative && incoming.blocksRevision === current.blocksRevision)
    ? incoming
    : current;
}

export function setPageBlocksCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState,
  next: PageBlocksSnapshotDTO,
  authoritative = false,
) {
  queryClient.setQueryData(
    pageBlocksKey(websiteId, pageId, state),
    (current: PageBlocksSnapshotDTO | undefined) =>
      adoptPageBlocksSnapshot(current, next, authoritative),
  );
}

export function patchPageBlocksCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState,
  patcher: (prev: PageBlocksSnapshotDTO) => PageBlocksSnapshotDTO,
) {
  queryClient.setQueryData(
    pageBlocksKey(websiteId, pageId, state),
    (prev: PageBlocksSnapshotDTO | undefined) => (prev ? patcher(prev) : prev),
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
