"use client";

/**
 * @file apps/studio/src/features/site/status/useSiteStatus.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Hook React Query : récupère l’état global du site draft vs published.
 *
 * @remarks
 * - Read-only.
 * - Le calcul est fait côté API `/api/studio/site/status`.
 * - Website-scoped : la queryKey inclut Prisma Website.id pour éviter
 *   les collisions de cache lors d’un switch de Website actif.
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
