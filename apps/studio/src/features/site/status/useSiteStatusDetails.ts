"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatusDetails.ts
 * @layer ui/hooks
 *
 * @description
 * Hook React Query (lazy) : détail pages/blocs (draft vs published) pour l’Overview.
 *
 * @remarks
 * V0.5 perf:
 * - `scope="dirty"` doit être le défaut côté UI (éviter les full-scans).
 * - On évite les refetch automatiques (focus/reconnect) qui peuvent relancer des scans.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  SiteStatusDetailsDTO,
  SiteStatusDetailsScopeDTO,
} from "@compoz/core/domain/site/dto";
import { siteAdminApi } from "@compoz/infra/http/studio/site.client";

type UseSiteStatusDetailsParams = Readonly<{
  enabled: boolean;
  scope?: SiteStatusDetailsScopeDTO; // default "dirty"
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

export function useSiteStatusDetails(params: UseSiteStatusDetailsParams) {
  const scope = params.scope ?? "dirty";
  const includeBlocks = params.includeBlocks ?? false;
  const pageId = (params.pageId ?? "").trim() || null;

  const options = {
    queryKey: [
      "admin",
      "site",
      "statusDetails",
      scope,
      includeBlocks,
      pageId,
    ] as const,

    queryFn: async (): Promise<SiteStatusDetailsDTO> => {
      const res = await siteAdminApi.statusDetails({
        scope,
        includeBlocks,
        pageId,
      });
      return res.details; // ✅ flatten
    },

    enabled: params.enabled,

    // ✅ garde l'ancienne data quand la key change
    placeholderData: keepPreviousData,

    // ✅ V0.5 perf : évite les refetch “bruit KV”
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    // ✅ évite de retaper KV trop souvent lors des navigations rapides
    staleTime: 15_000,
  } as const;

  return useQuery(options);
}
