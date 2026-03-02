/**
 * @file  apps/studio/src/features/site/status/invalidate.ts
 * @layer hooks/admin/site/status
 *
 * @description
 * helpers React Query pour invalider / refetch le cache du statut du site.
 */

import type { QueryClient } from "@tanstack/react-query";
import { siteStatusDetailsKey } from "@compoz/studio/features/site/status/keys";

/** Key SoT */
const siteStatusKey = ["admin", "site", "status"] as const;
/** Key prefix SoT */
const siteStatusDetailsPrefix = ["admin", "site", "statusDetails"] as const;

/** Invalide la query "status" (overview). */
export function invalidateSiteStatus(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: siteStatusKey });
}

/**
 * Refetch immédiat de "status".
 * @remarks
 * `type: "active"` ne marche pas si l’overview n’est pas monté au moment du save.
 * Ici on force `all` pour mettre à jour le cache même hors écran.
 */
export function refetchSiteStatus(qc: QueryClient) {
  return qc.refetchQueries({
    queryKey: siteStatusKey,
    type: "all",
  });
}

export function invalidateSiteStatusDetails(qc: QueryClient) {
  return qc.invalidateQueries({
    queryKey: siteStatusDetailsPrefix,
  });
}

export function refetchSiteStatusDetails(qc: QueryClient) {
  return qc.refetchQueries({
    queryKey: siteStatusDetailsPrefix,
    type: "all",
  });
}

export function invalidateBlocksBadgesForPage(qc: QueryClient, pageId: string) {
  return qc.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      scope: "all",
      includeBlocks: true,
      pageId,
    }),
  });
}

export function invalidatePageStatusDetails(qc: QueryClient, pageId: string) {
  const pid = (pageId ?? "").trim();
  if (!pid) return Promise.resolve();

  return qc.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      scope: "all",
      includeBlocks: false,
      pageId: pid,
    }),
  });
}
