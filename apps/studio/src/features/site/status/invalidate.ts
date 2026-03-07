/**
 * @file apps/studio/src/features/site/status/invalidate.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Helpers React Query pour invalider / refetch le cache du statut du site.
 *
 * @remarks
 * Tenant-scoped : toutes les invalidations/refetch doivent inclure tenantId
 * pour éviter les collisions entre sites quand on switch de tenant.
 */

import type { QueryClient } from "@tanstack/react-query";

import {
  siteStatusDetailsKey,
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export function invalidateSiteStatus(qc: QueryClient, tenantId: string) {
  return qc.invalidateQueries({ queryKey: siteStatusKey(tenantId) });
}

export function refetchSiteStatus(qc: QueryClient, tenantId: string) {
  return qc.refetchQueries({
    queryKey: siteStatusKey(tenantId),
    type: "all",
  });
}

/* -------------------------------------------------------------------------- */
/* Status details                                                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Helpers ciblés                                                             */
/* -------------------------------------------------------------------------- */

type StatusDetailsScope = "all" | "dirty";

type InvalidateStatusDetailsArgs = Readonly<{
  tenantId: string;
  scope: StatusDetailsScope;
  includeBlocks: boolean;
  pageId?: string | null;
}>;

export function invalidateStatusDetailsByKey(
  qc: QueryClient,
  args: InvalidateStatusDetailsArgs,
) {
  const pageId = (args.pageId ?? "").trim();

  return qc.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      tenantId: args.tenantId,
      scope: args.scope,
      includeBlocks: args.includeBlocks,
      pageId: pageId || null,
    }),
  });
}

export function refetchStatusDetailsByKey(
  qc: QueryClient,
  args: InvalidateStatusDetailsArgs,
) {
  const pageId = (args.pageId ?? "").trim();

  return qc.refetchQueries({
    queryKey: siteStatusDetailsKey({
      tenantId: args.tenantId,
      scope: args.scope,
      includeBlocks: args.includeBlocks,
      pageId: pageId || null,
    }),
    type: "all",
  });
}

/* -------------------------------------------------------------------------- */
/* Overview / pages                                                           */
/* -------------------------------------------------------------------------- */

export function invalidateDirtyPagesStatusList(
  qc: QueryClient,
  tenantId: string,
) {
  return invalidateStatusDetailsByKey(qc, {
    tenantId,
    scope: "dirty",
    includeBlocks: false,
    pageId: null,
  });
}

export function invalidateOverviewBlocksStatusDetails(
  qc: QueryClient,
  tenantId: string,
) {
  return Promise.all([
    invalidateStatusDetailsByKey(qc, {
      tenantId,
      scope: "dirty",
      includeBlocks: true,
      pageId: null,
    }),
    invalidateStatusDetailsByKey(qc, {
      tenantId,
      scope: "all",
      includeBlocks: true,
      pageId: null,
    }),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Page / blocks ciblés                                                       */
/* -------------------------------------------------------------------------- */

export function invalidateBlocksBadgesForPage(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  const pid = (pageId ?? "").trim();
  if (!pid) return Promise.resolve([]);

  return invalidateStatusDetailsByKey(qc, {
    tenantId,
    scope: "dirty",
    includeBlocks: true,
    pageId: pid,
  });
}

export function refetchBlocksStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId?: string,
  scope: StatusDetailsScope = "dirty",
) {
  return refetchStatusDetailsByKey(qc, {
    tenantId,
    scope,
    includeBlocks: true,
    pageId,
  });
}

export function invalidatePageStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  scope: StatusDetailsScope = "dirty",
) {
  const pid = (pageId ?? "").trim();
  if (!pid) return Promise.resolve([]);

  return invalidateStatusDetailsByKey(qc, {
    tenantId,
    scope,
    includeBlocks: false,
    pageId: pid,
  });
}

export function refetchPageStatusDetails(
  qc: QueryClient,
  tenantId: string,
  pageId?: string,
  scope: StatusDetailsScope = "dirty",
) {
  return refetchStatusDetailsByKey(qc, {
    tenantId,
    scope,
    includeBlocks: false,
    pageId,
  });
}

/* -------------------------------------------------------------------------- */
/* Compositions métier                                                        */
/* -------------------------------------------------------------------------- */

export function invalidatePageStatusViews(qc: QueryClient, tenantId: string) {
  return Promise.all([
    invalidateDirtyPagesStatusList(qc, tenantId),
    invalidateOverviewBlocksStatusDetails(qc, tenantId),
  ]);
}

export function invalidateBlockStatusViews(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
) {
  return Promise.all([
    invalidateBlocksBadgesForPage(qc, tenantId, pageId),
    invalidateDirtyPagesStatusList(qc, tenantId),
    invalidateOverviewBlocksStatusDetails(qc, tenantId),
  ]);
}
