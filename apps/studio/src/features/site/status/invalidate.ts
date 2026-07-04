/**
 * @file apps/studio/src/features/site/status/invalidate.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Helpers React Query pour invalider / refetch le cache du statut du site.
 *
 * @remarks
 * Website-scoped : toutes les invalidations/refetch doivent inclure
 * Prisma Website.id pour éviter les collisions entre sites quand on switch
 * de Website actif.
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

export function invalidateSiteStatus(
  queryClient: QueryClient,
  websiteId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: siteStatusKey(websiteId),
  });
}

export function refetchSiteStatus(queryClient: QueryClient, websiteId: string) {
  return queryClient.refetchQueries({
    queryKey: siteStatusKey(websiteId),
    type: "all",
  });
}

/* -------------------------------------------------------------------------- */
/* Status details                                                             */
/* -------------------------------------------------------------------------- */

export function invalidateSiteStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: siteStatusDetailsPrefix(websiteId),
  });
}

export function refetchSiteStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
) {
  return queryClient.refetchQueries({
    queryKey: siteStatusDetailsPrefix(websiteId),
    type: "all",
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers ciblés                                                             */
/* -------------------------------------------------------------------------- */

type StatusDetailsScope = "all" | "dirty";

type InvalidateStatusDetailsArgs = Readonly<{
  websiteId: string;
  scope: StatusDetailsScope;
  includeBlocks: boolean;
  pageId?: string | null;
}>;

export function invalidateStatusDetailsByKey(
  queryClient: QueryClient,
  args: InvalidateStatusDetailsArgs,
) {
  const pageId = String(args.pageId ?? "").trim();

  return queryClient.invalidateQueries({
    queryKey: siteStatusDetailsKey({
      websiteId: args.websiteId,
      scope: args.scope,
      includeBlocks: args.includeBlocks,
      pageId: pageId || null,
    }),
  });
}

export function refetchStatusDetailsByKey(
  queryClient: QueryClient,
  args: InvalidateStatusDetailsArgs,
) {
  const pageId = String(args.pageId ?? "").trim();

  return queryClient.refetchQueries({
    queryKey: siteStatusDetailsKey({
      websiteId: args.websiteId,
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
  queryClient: QueryClient,
  websiteId: string,
) {
  return invalidateStatusDetailsByKey(queryClient, {
    websiteId,
    scope: "dirty",
    includeBlocks: false,
    pageId: null,
  });
}

export function invalidateOverviewBlocksStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
) {
  return Promise.all([
    invalidateStatusDetailsByKey(queryClient, {
      websiteId,
      scope: "dirty",
      includeBlocks: true,
      pageId: null,
    }),
    invalidateStatusDetailsByKey(queryClient, {
      websiteId,
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
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
) {
  const pageIdKey = String(pageId ?? "").trim();

  if (!pageIdKey) return Promise.resolve([]);

  return invalidateStatusDetailsByKey(queryClient, {
    websiteId,
    scope: "dirty",
    includeBlocks: true,
    pageId: pageIdKey,
  });
}

export function refetchBlocksStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
  pageId?: string,
  scope: StatusDetailsScope = "dirty",
) {
  return refetchStatusDetailsByKey(queryClient, {
    websiteId,
    scope,
    includeBlocks: true,
    pageId,
  });
}

export function invalidatePageStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  scope: StatusDetailsScope = "dirty",
) {
  const pageIdKey = String(pageId ?? "").trim();

  if (!pageIdKey) return Promise.resolve([]);

  return invalidateStatusDetailsByKey(queryClient, {
    websiteId,
    scope,
    includeBlocks: false,
    pageId: pageIdKey,
  });
}

export function refetchPageStatusDetails(
  queryClient: QueryClient,
  websiteId: string,
  pageId?: string,
  scope: StatusDetailsScope = "dirty",
) {
  return refetchStatusDetailsByKey(queryClient, {
    websiteId,
    scope,
    includeBlocks: false,
    pageId,
  });
}

/* -------------------------------------------------------------------------- */
/* Compositions métier                                                        */
/* -------------------------------------------------------------------------- */

export function invalidatePageStatusViews(
  queryClient: QueryClient,
  websiteId: string,
) {
  return Promise.all([
    invalidateDirtyPagesStatusList(queryClient, websiteId),
    invalidateOverviewBlocksStatusDetails(queryClient, websiteId),
  ]);
}

export function invalidateBlockStatusViews(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
) {
  return Promise.all([
    invalidateBlocksBadgesForPage(queryClient, websiteId, pageId),
    invalidateDirtyPagesStatusList(queryClient, websiteId),
    invalidateOverviewBlocksStatusDetails(queryClient, websiteId),
  ]);
}
