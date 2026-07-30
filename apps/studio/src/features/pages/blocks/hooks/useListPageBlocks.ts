"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useListPageBlocks.ts
 * @layer studio/features/pages/blocks/hooks
 *
 * @description
 * React Query hook for reading a page block list through the pages Studio API.
 *
 * @remarks
 * - Reads draft blocks by default through `DEFAULT_CONTENT_STATE`.
 * - Uses load instrumentation with the requested content state for logs and notifications.
 * - Studio query keys are scoped by Prisma Website.id and content state.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  BlockDTO,
  PageBlocksSnapshotDTO,
} from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { ListPageBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { adoptPageBlocksSnapshot } from "@compoz/studio/features/pages/blocks/cache/cache";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

const logger = log.child({ ns: "hook", name: "useListPageBlocks" });

const EMPTY_BLOCKS: ReadonlyArray<BlockDTO> = [];

type UseListPageBlocksResult = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
  blocksRevision: number;
  snapshot: PageBlocksSnapshotDTO | null;
  isLoading: boolean;
  isFetching: boolean;
}>;

export function useListPageBlocks(
  pageId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseListPageBlocksResult {
  const t = useTranslations();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.blocks");

  const pageIdKey = String(pageId ?? "").trim();
  const enabled = Boolean(websiteId && pageIdKey);

  const query = useQuery<PageBlocksSnapshotDTO>({
    queryKey: pageBlocksKey(websiteId, pageIdKey, state),
    enabled,

    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<PageBlocksSnapshotDTO> => {
      const response: ListPageBlocksResponse = await withLoadLogs(
        "useListPageBlocks",
        state,
        () => pagesStudioApi.getPageBlocks(pageIdKey, state, { signal }),
        {
          entity: entityLabel,
          websiteId,
          pageId: pageIdKey,
        },
      );

      const blocks = response.blocks ?? [];

      logger.debug("read.ok", {
        websiteId,
        pageId: pageIdKey,
        state,
        count: blocks.length,
      });

      return {
        blocks,
        blocksRevision: response.blocksRevision,
      };
    },

    refetchOnWindowFocus: false,
    structuralSharing: (current, incoming) =>
      adoptPageBlocksSnapshot(
        current as PageBlocksSnapshotDTO | undefined,
        incoming as PageBlocksSnapshotDTO,
      ),
  });

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);

    logger.error("read.failed", {
      websiteId,
      pageId: pageIdKey,
      state,
      msg: String(query.error),
    });
  }, [query.error, websiteId, pageIdKey, state]);

  return {
    blocks: enabled ? (query.data?.blocks ?? EMPTY_BLOCKS) : EMPTY_BLOCKS,
    blocksRevision: enabled ? (query.data?.blocksRevision ?? 0) : 0,
    snapshot: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
    isFetching: enabled ? query.isFetching : false,
  };
}

useListPageBlocks.displayName = "useListPageBlocks";
