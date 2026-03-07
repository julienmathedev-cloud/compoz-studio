"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatus.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Hook React Query : récupère l’état global du site (draft vs published).
 *
 * @remarks
 * V0.5 : read-only. Le calcul est fait côté API `/api/studio/site/status`.
 * Tenant-scoped : la queryKey inclut tenantId (sinon cache cross-tenant).
 */

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { siteStatusKey } from "@compoz/studio/features/site/status/keys";
import { useQuery } from "@tanstack/react-query";

export function useSiteStatus() {
  const tenantId = useTenantId();
  const enabled = Boolean(String(tenantId ?? "").trim());

  const options = {
    queryKey: siteStatusKey(tenantId),
    enabled,
    queryFn: async (): Promise<SiteStatusDTO> => {
      const res = await siteStudioApi.status();
      return res.status;
    },
    placeholderData: (prev?: SiteStatusDTO) => prev,
  } as const;

  return useQuery<SiteStatusDTO>(options);
}

useSiteStatus.displayName = "useSiteStatus";
