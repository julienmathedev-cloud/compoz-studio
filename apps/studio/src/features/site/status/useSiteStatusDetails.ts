"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatusDetails.ts
 * @layer hooks/studio/site/status
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
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { siteStatusDetailsKey } from "@compoz/studio/features/site/status/keys";

type UseSiteStatusDetailsParams = Readonly<{
  enabled: boolean;
  scope?: SiteStatusDetailsScopeDTO; // default "dirty"
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

export function useSiteStatusDetails({
  enabled,
  scope = "dirty",
  includeBlocks = false,
  pageId,
}: UseSiteStatusDetailsParams) {
  const tenantId = useTenantId();

  const pid = (pageId ?? "").trim();
  const pId = pid ? pid : null;

  const isEnabled = Boolean(enabled) && Boolean(String(tenantId ?? "").trim());

  const options = {
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope,
      includeBlocks,
      pageId: pId,
    }),

    queryFn: async (): Promise<SiteStatusDetailsDTO> => {
      const res = await siteStudioApi.statusDetails({
        scope,
        includeBlocks,
        pageId,
      });
      return res.details; // ✅ flatten
    },

    enabled: isEnabled,

    // ✅ garde l'ancienne data quand la key change
    placeholderData: keepPreviousData,
  } as const;

  return useQuery<SiteStatusDetailsDTO>(options);
}

useSiteStatusDetails.displayName = "useSiteStatusDetails";
