/**
 * @file apps/studio/src/features/pages/blocks/hooks/block-reorder-conflict.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Adopts the authoritative Blocks snapshot after a rejected reorder.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";

export function adoptPageBlocksReorderConflict(input: Readonly<{
  queryClient: QueryClient;
  websiteId: string;
  pageId: string;
  error: unknown;
}>): PageBlocksConflictDetails | null {
  const details = getPageBlocksConflictDetails(input.error);
  if (!details || details.operation !== "reorder") return null;

  syncPageBlocksSnapshotCache(
    input.queryClient,
    input.websiteId,
    input.pageId,
    details.current,
    DEFAULT_CONTENT_STATE,
    true,
  );

  return details;
}
