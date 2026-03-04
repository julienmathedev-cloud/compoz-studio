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
 * - Draft-only par défaut.
 * - Tenant-scoped : la queryKey inclut tenantId pour éviter les caches “croisés” au switch.
 */

import { notify } from "@compoz/studio/lib/ui/notify";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import type { ListPageBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

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
  const entityLabel = t("admin.shared.entities.blocks");
  const tenantId = useTenantId();

  const tid = useMemo(
    () =>
      String(tenantId ?? "")
        .trim()
        .toLowerCase(),
    [tenantId],
  );

  const pid = useMemo(() => String(pageId ?? "").trim(), [pageId]);

  const enabled = Boolean(tid && pid);

  const options = {
    queryKey: pageBlocksKey(tid, pid, state),
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
        () => pagesAdminApi.getPageBlocks(pid, state, { signal }),
        { entity: entityLabel, tenantId: tid, pageId: pid },
      );

      // ✅ flatten
      const blocks = res.blocks ?? [];
      lg.debug("read.ok", {
        tenantId: tid,
        pageId: pid,
        state,
        count: blocks.length,
      });
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
    lg.error("read.failed", {
      tenantId: tid,
      pageId: pid,
      state,
      msg: String(query.error),
    });
  }, [query.error, tid, pid, state]);

  return {
    blocks: enabled ? (query.data ?? []) : [],
    isLoading: enabled ? query.isPending : false,
  } as const;
}

useListPageBlocks.displayName = "useListPageBlocks";
