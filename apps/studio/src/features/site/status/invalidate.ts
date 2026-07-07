/**
 * @file apps/studio/src/features/site/status/invalidate.ts
 * @layer studio/features/site/status
 *
 * @description
 * React Query helpers for invalidating and refetching site status caches.
 *
 * @remarks
 * - All keys are scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 * - Composite helpers invalidate the status views affected by page or block mutations.
 */

import type { QueryClient } from "@tanstack/react-query";

import {
  siteStatusDetailsKey,
  siteStatusDetailsPrefix,
  siteStatusKey,
} from "@compoz/studio/features/site/status/keys";

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

/** Composite invalidations used after page or block mutations. */

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
