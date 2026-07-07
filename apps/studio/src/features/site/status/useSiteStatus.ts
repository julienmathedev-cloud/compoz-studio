"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatus.ts
 * @layer studio/features/site/status
 *
 * @description
 * React Query hook for reading the global draft vs published site status.
 *
 * @remarks
 * - Read-only: status computation remains handled by the `/api/studio/site/status` route.
 * - The query key is scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 */

import { useQuery } from "@tanstack/react-query";

import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { siteStatusKey } from "@compoz/studio/features/site/status/keys";

export function useSiteStatus() {
  const websiteId = useWebsiteId();
  const enabled = Boolean(String(websiteId ?? "").trim());

  const options = {
    queryKey: siteStatusKey(websiteId),
    enabled,
    queryFn: async (): Promise<SiteStatusDTO> => {
      const response = await siteStudioApi.status();

      return response.status;
    },
    placeholderData: (previous?: SiteStatusDTO) => previous,
  } as const;

  return useQuery<SiteStatusDTO>(options);
}

useSiteStatus.displayName = "useSiteStatus";
