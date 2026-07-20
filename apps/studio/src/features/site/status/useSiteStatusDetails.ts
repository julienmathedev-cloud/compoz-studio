"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatusDetails.ts
 * @layer studio/features/site/status
 *
 * @description
 * Lazy React Query hook for reading draft vs published page and block status details.
 *
 * @remarks
 * - `scope="dirty"` stays the UI default to avoid full status scans in the Overview.
 * - Automatic focus/reconnect refetches are intentionally avoided by the query defaults used for this status flow.
 * - The query key is scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 */

import { useQuery } from "@tanstack/react-query";

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
  } as const;

  return useQuery<SiteStatusDetailsDTO>(options);
}

useSiteStatusDetails.displayName = "useSiteStatusDetails";
