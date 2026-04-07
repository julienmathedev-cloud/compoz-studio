"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useListPageBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook studio React Query pour lire les blocks d’une page via l’API.
 *
 * @remarks
 * - Read-only.
 * - Draft-only par défaut.
 * - Tenant-scoped : la queryKey inclut `tenantId` pour éviter les caches croisés au switch.
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
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

const lg = log.child({ ns: "hook", name: "useListPageBlocks" });

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
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.blocks");

  const pageIdKey = String(pageId ?? "").trim();
  const enabled = Boolean(tenantId && pageIdKey);

  const options = {
    queryKey: pageBlocksKey(tenantId, pageIdKey, state),
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
        { entity: entityLabel, tenantId: tenantId, pageId: pageIdKey },
      );

      const blocks = response.blocks ?? [];

      lg.debug("read.ok", {
        tenantId: tenantId,
        pageId: pageIdKey,
        state,
        count: blocks.length,
      });

      return blocks;
    },

    refetchOnWindowFocus: false,
    placeholderData: (prev?: ReadonlyArray<BlockDTO>) => prev ?? [],
  } as const;

  const query = useQuery(options);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("read.failed", {
      tenantId: tenantId,
      pageId: pageIdKey,
      state,
      msg: String(query.error),
    });
  }, [query.error, tenantId, pageIdKey, state]);

  return {
    blocks: enabled ? (query.data ?? []) : [],
    isLoading: enabled ? query.isPending : false,
    isFetching: enabled ? query.isFetching : false,
  } as const;
}

useListPageBlocks.displayName = "useListPageBlocks";
