"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useListPageBlocks.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Hook admin React Query pour lire les blocks d’une page via l’API.
 *
 * @remarks
 * - Read-only.
 * - Le refresh est déclenché uniquement via invalidation (`invalidateDraftBlocksList`).
 * - Draft-only par défaut.
 */

import { notify } from "@compoz/studio/lib/ui/notify";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import type { ListPageBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

const lg = log.child({ ns: "hook", name: "useListPageBlocks" });

type UseListPageBlocksResult = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
  isLoading: boolean;
}>;

export function useListPageBlocks(
  pageId: string,
  state: ContentState = WRITE_CONTENT_STATE,
): UseListPageBlocksResult {
  const t = useTranslations();
  const enabled = Boolean(pageId?.trim());
  const entityLabel = t("admin.shared.entities.blocks");

  const options = {
    queryKey: pageBlocksKey(pageId, state),
    enabled,

    // ✅ hook retourne des blocks (DTO UI), mais consomme la route SoT
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<ReadonlyArray<BlockDTO>> => {
      const res: ListPageBlocksResponse = await withLoadLogs(
        "useListPageBlocks",
        state,
        () => pagesAdminApi.getPageBlocks(pageId, state, { signal }),
        { entity: entityLabel, pageId },
      );

      // ✅ flatten
      const blocks = res.blocks ?? [];
      lg.debug("read.ok", { pageId, state, count: blocks.length });
      return blocks;
    },

    refetchOnWindowFocus: false,

    // ✅ important : prev peut être undefined
    placeholderData: (prev?: ReadonlyArray<BlockDTO>) => prev ?? [],
  } as const;

  const query = useQuery(options);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("read.failed", { pageId, state, msg: String(query.error) });
  }, [query.error, pageId, state]);

  return {
    blocks: enabled ? (query.data ?? []) : [],
    isLoading: enabled ? query.isPending : false,
  } as const;
}
