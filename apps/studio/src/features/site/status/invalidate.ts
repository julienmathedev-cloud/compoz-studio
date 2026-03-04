/**
 * @file  apps/studio/src/features/site/status/invalidate.ts
 * @layer hooks/admin/site/status
 *
 * @description
 * helpers React Query pour invalider / refetch le cache du statut du site.
 *
 * @remarks
 * Tenant-scoped : toutes les invalidations/refetch doivent inclure tenantId
 * pour éviter les collisions entre sites quand on switch de tenant.
 */

import {
  siteStatusDetailsKey,
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";
import type { QueryClient } from "@tanstack/react-query";

export function invalidateSiteStatus(qc: QueryClient, tenantId: string) {
  return qc.invalidateQueries({ queryKey: siteStatusKey(tenantId) });
}

export function refetchSiteStatus(qc: QueryClient, tenantId: string) {
  return qc.refetchQueries({
    queryKey: siteStatusKey(tenantId),
    type: "all",
  });
}

export function invalidateSiteStatusDetails(qc: QueryClient, tenantId: string) {
  return qc.invalidateQueries({
    queryKey: siteStatusDetailsPrefix(tenantId),
  });
}

export function refetchSiteStatusDetails(qc: QueryClient, tenantId: string) {
  return qc.refetchQueries({
    queryKey: siteStatusDetailsPrefix(tenantId),
    type: "all",
  });
}

export function invalidateBlocksBadgesForPage(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  console.log(
    "invalidateBlocksBadgesForPage.key",
    siteStatusDetailsKey({
      tenantId,
      scope: "dirty",
      includeBlocks: true,
      pageId,
    }),
  );
  console.log(
    "matchingQueries",
    qc
      .getQueryCache()
      .findAll({
        queryKey: siteStatusDetailsKey({
          tenantId,
          scope: "dirty",
          includeBlocks: true,
          pageId,
        }),
      })
      .map((q) => q.queryKey),
  );
  return qc.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope: "dirty",
      includeBlocks: true,
      pageId,
    }),
  });
}

export function refetchblocksStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId?: string,
) {
  return qc.refetchQueries({
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope: "all",
      includeBlocks: true,
      pageId,
    }),
    type: "all",
  });
}

export function invalidatePageStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  const pid = (pageId ?? "").trim();
  if (!pid) return Promise.resolve();

  return qc.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope: "all",
      includeBlocks: false,
      pageId: pid,
    }),
  });
}

export function refetchPageStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId?: string,
) {
  return qc.refetchQueries({
    queryKey: siteStatusDetailsKey({
      tenantId,
      scope: "all",
      includeBlocks: false,
      pageId,
    }),
    type: "all",
  });
}
