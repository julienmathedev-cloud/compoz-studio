"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useListPageBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook Studio React Query pour lire les blocks d’une page via l’API.
 *
 * @remarks
 * - Read-only.
 * - Draft-only par défaut.
 * - Website-scoped : la queryKey inclut `websiteId` pour éviter les caches
 *   croisés lors d’un switch de Website actif.
 * - Le scope utilisé ici est Prisma Website.id.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { ListPageBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

const logger = log.child({ ns: "hook", name: "useListPageBlocks" });

type UseListPageBlocksResult = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
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

  const query = useQuery({
    queryKey: pageBlocksKey(websiteId, pageIdKey, state),
    enabled,

    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<ReadonlyArray<BlockDTO>> => {
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

      return blocks;
    },

    refetchOnWindowFocus: false,
    placeholderData: (previous?: ReadonlyArray<BlockDTO>) => previous ?? [],
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
    blocks: enabled ? (query.data ?? []) : [],
    isLoading: enabled ? query.isPending : false,
    isFetching: enabled ? query.isFetching : false,
  };
}

useListPageBlocks.displayName = "useListPageBlocks";
