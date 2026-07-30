/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.ts
 * @layer studio/features/pages/blocks/cache
 * @description Applies targeted block snapshots without overwriting Page metadata or structure.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  PageBlocksSnapshotDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import { setPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function syncPageBlocksSnapshotCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  snapshot: PageBlocksSnapshotDTO,
  state: ContentState = DEFAULT_CONTENT_STATE,
  authoritative = false,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();
  if (!websiteIdKey || !pageIdKey) return;

  queryClient.setQueryData(
    pageByIdKey(websiteIdKey, pageIdKey, state),
    (current: PageWithRevisionsDTO | undefined) => {
      if (
        !current ||
        snapshot.blocksRevision < current.revisions.blocksRevision ||
        (!authoritative &&
          snapshot.blocksRevision === current.revisions.blocksRevision)
      ) {
        return current;
      }
      return {
        page: { ...current.page, blocks: snapshot.blocks },
        revisions: {
          ...current.revisions,
          blocksRevision: snapshot.blocksRevision,
        },
      };
    },
  );

  setPageBlocksCache(
    queryClient,
    websiteIdKey,
    pageIdKey,
    state,
    snapshot,
    authoritative,
  );
}
