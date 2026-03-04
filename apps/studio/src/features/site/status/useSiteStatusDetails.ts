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
 * Tenant-scoped :
 * - La queryKey inclut tenantId (sinon cache cross-tenant après switch).
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  SiteStatusDetailsDTO,
  SiteStatusDetailsScopeDTO,
} from "@compoz/core/domain/site/dto";
import { siteAdminApi } from "@compoz/infra/http/studio/site.client";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";

type UseSiteStatusDetailsParams = Readonly<{
  enabled: boolean;
  scope?: SiteStatusDetailsScopeDTO; // default "dirty"
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

function siteStatusDetailsKey(args: {
  tenantId: string;
  scope: SiteStatusDetailsScopeDTO;
  includeBlocks: boolean;
  pageId: string | null;
}) {
  const tid = String(args.tenantId ?? "")
    .trim()
    .toLowerCase();

  const pageId = (args.pageId ?? "").trim() || null;

  return [
    "t",
    tid,
    "admin",
    "site",
    "statusDetails",
    args.scope,
    args.includeBlocks,
    pageId,
  ] as const;
}

export function useSiteStatusDetails({
  enabled,
  scope = "dirty",
  includeBlocks = false,
  pageId,
}: UseSiteStatusDetailsParams) {
  const pId = (pageId ?? "").trim() || null;
  const tenantId = useTenantId();

  const isEnabled = Boolean(enabled) && Boolean(String(tenantId ?? "").trim());

  const options = {
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope,
      includeBlocks,
      pageId: pId,
    }),

    queryFn: async (): Promise<SiteStatusDetailsDTO> => {
      const res = await siteAdminApi.statusDetails({
        scope,
        includeBlocks,
        pageId,
      });
      return res.details; // ✅ flatten
    },

    enabled: isEnabled,

    // ✅ garde l'ancienne data quand la key change
    placeholderData: keepPreviousData,

    // ✅ V0.5 perf : évite les refetch “bruit KV”
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } as const;

  return useQuery(options);
}
