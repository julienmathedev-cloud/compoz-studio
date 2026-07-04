"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatusDetails.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Hook React Query lazy : détail pages/blocs draft vs published pour l’Overview.
 *
 * @remarks
 * V0.5 perf :
 * - `scope="dirty"` doit être le défaut côté UI pour éviter les full scans.
 * - On évite les refetch automatiques focus/reconnect qui peuvent relancer
 *   des scans.
 *
 * Website-scoped :
 * - La queryKey inclut Prisma Website.id pour éviter les collisions de cache
 *   après switch de Website actif.
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  SiteStatusDetailsDTO,
  SiteStatusDetailsScopeDTO,
} from "@compoz/core/domain/site/dto";
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { siteStatusDetailsKey } from "@compoz/studio/features/site/status/keys";

type UseSiteStatusDetailsParams = Readonly<{
  enabled: boolean;
  scope?: SiteStatusDetailsScopeDTO;
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

export function useSiteStatusDetails({
  enabled,
  scope = "dirty",
  includeBlocks = false,
  pageId,
}: UseSiteStatusDetailsParams) {
  const websiteId = useWebsiteId();

  const pageIdKey = String(pageId ?? "").trim();
  const normalizedPageId = pageIdKey ? pageIdKey : null;

  const isEnabled = Boolean(enabled) && Boolean(String(websiteId ?? "").trim());

  const options = {
    queryKey: siteStatusDetailsKey({
      websiteId,
      scope,
      includeBlocks,
      pageId: normalizedPageId,
    }),

    queryFn: async (): Promise<SiteStatusDetailsDTO> => {
      const response = await siteStudioApi.statusDetails({
        scope,
        includeBlocks,
        pageId: normalizedPageId,
      });

      return response.details;
    },

    enabled: isEnabled,

    /**
     * Garde l’ancienne data quand la key change.
     */
    placeholderData: keepPreviousData,
  } as const;

  return useQuery<SiteStatusDetailsDTO>(options);
}

useSiteStatusDetails.displayName = "useSiteStatusDetails";
