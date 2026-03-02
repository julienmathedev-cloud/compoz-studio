"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatus.ts
 * @layer hooks/admin
 *
 * @description
 * Hook React Query : récupère l’état global du site (draft vs published).
 *
 * @remarks
 * V0.5 : read-only. Le calcul est fait côté API `/api/admin/site/status`.
 */

import { useQuery } from "@tanstack/react-query";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";
import { siteAdminApi } from "@compoz/infra/http/studio/site.client";

export function useSiteStatus() {
  const options = {
    queryKey: ["admin", "site", "status"] as const,
    queryFn: async (): Promise<SiteStatusDTO> => {
      const res = await siteAdminApi.status();
      return res.status;
    },
  } as const;

  return useQuery(options);
}

useSiteStatus.displayName = "useSiteStatus";
