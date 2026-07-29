/**
 * @file apps/studio/src/features/site-index/cache.ts
 * @layer studio/features/site-index
 *
 * @description
 * React Query cache helpers for the Studio SiteIndex.
 *
 * @remarks
 * - Allows mutations such as reorder, create, and delete to seed or patch the SiteIndex without a broad invalidation.
 * - Cache entries are scoped by Prisma Website.id to avoid collisions when switching the active website.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function setDraftStructureCache(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  next: DraftSiteIndexWithRevisionDTO,
): void {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "setDraftStructureCache.websiteId",
  );

  queryClient.setQueryData(
    siteIndexKey(websiteIdKey, state),
    (current: DraftSiteIndexWithRevisionDTO | undefined) =>
      adoptDraftStructureSnapshot(current, next),
  );
}

export function adoptDraftStructureSnapshot(
  current: DraftSiteIndexWithRevisionDTO | undefined,
  incoming: DraftSiteIndexWithRevisionDTO,
): DraftSiteIndexWithRevisionDTO {
  if (!current) return incoming;

  if (
    incoming.draftStructureRevision <= current.draftStructureRevision
  ) {
    return current;
  }

  return incoming;
}

/**
 * Adopts a GET result without allowing an equal-revision response to replace
 * locally established structure ordering or membership.
 */
export function adoptMonotoneDraftStructureRead(
  current: DraftSiteIndexWithRevisionDTO | undefined,
  incoming: DraftSiteIndexWithRevisionDTO,
): DraftSiteIndexWithRevisionDTO {
  return adoptDraftStructureSnapshot(current, incoming);
}

export type ReorderOptimisticContext = Readonly<{
  before: DraftSiteIndexWithRevisionDTO;
  optimistic: DraftSiteIndexWithRevisionDTO;
  parentPageId: string | null;
  orderedPageIdsBefore: ReadonlyArray<string>;
  orderedPageIdsOptimistic: ReadonlyArray<string>;
}>;

export function rollbackDraftStructureReorder(
  current: DraftSiteIndexWithRevisionDTO,
  context: ReorderOptimisticContext,
): DraftSiteIndexWithRevisionDTO {
  if (
    current.draftStructureRevision >
    context.before.draftStructureRevision
  ) {
    return current;
  }

  const currentSiblingIds = current.index.pages
    .filter((page) => page.parentId === context.parentPageId)
    .map((page) => page.id);
  const currentSiblingIdSet = new Set(currentSiblingIds);
  const expectedOptimisticOrder =
    context.orderedPageIdsOptimistic.filter((pageId) =>
      currentSiblingIdSet.has(pageId),
    );

  if (
    currentSiblingIds.length !== expectedOptimisticOrder.length ||
    currentSiblingIds.some(
      (pageId, index) => pageId !== expectedOptimisticOrder[index],
    )
  ) {
    return current;
  }

  const restoredOrder = context.orderedPageIdsBefore.filter((pageId) =>
    currentSiblingIdSet.has(pageId),
  );
  if (restoredOrder.length !== currentSiblingIds.length) {
    return current;
  }

  const currentSiblingsById = new Map(
    current.index.pages
      .filter((page) => page.parentId === context.parentPageId)
      .map((page) => [page.id, page]),
  );
  let siblingIndex = 0;

  return {
    ...current,
    index: {
      ...current.index,
      pages: current.index.pages.map((page) => {
        if (page.parentId !== context.parentPageId) return page;

        const pageId = restoredOrder[siblingIndex++];
        return pageId
          ? (currentSiblingsById.get(pageId) ?? page)
          : page;
      }),
    },
  };
}

export function adoptDraftStructurePagePatch(
  current: DraftSiteIndexWithRevisionDTO | undefined,
  incoming: DraftSiteIndexWithRevisionDTO,
  page: Readonly<{
    id: string;
    parentId: string | null;
    slug: string;
    name: string;
  }>,
): DraftSiteIndexWithRevisionDTO {
  if (
    current &&
    incoming.draftStructureRevision <
      current.draftStructureRevision
  ) {
    return current;
  }

  const adopted = adoptDraftStructureSnapshot(current, incoming);
  if (!adopted.index.pages.some((item) => item.id === page.id)) {
    return adopted;
  }

  return {
    ...adopted,
    index: {
      ...adopted.index,
      pages: adopted.index.pages.map((item) =>
        item.id === page.id
          ? {
              ...item,
              parentId: page.parentId,
              slug: page.slug,
              name: page.name,
            }
          : item,
      ),
    },
  };
}

export function adoptDraftStructurePagePatchCache(
  queryClient: QueryClient,
  websiteId: unknown,
  incoming: DraftSiteIndexWithRevisionDTO,
  page: Readonly<{
    id: string;
    parentId: string | null;
    slug: string;
    name: string;
  }>,
  state: ContentState = DEFAULT_CONTENT_STATE,
): void {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "adoptDraftStructurePagePatchCache.websiteId",
  );

  queryClient.setQueryData(
    siteIndexKey(websiteIdKey, state),
    (current: DraftSiteIndexWithRevisionDTO | undefined) =>
      adoptDraftStructurePagePatch(current, incoming, page),
  );
}

/**
 * Patches the cached SiteIndex without creating a new cache entry when none exists.
 *
 * @remarks
 * - The no-op fallback avoids inventing an incomplete SiteIndex after a mutation response.
 */
export function patchDraftStructureCache(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
  patcher: (
    prev: DraftSiteIndexWithRevisionDTO,
  ) => DraftSiteIndexWithRevisionDTO,
): void {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "patchDraftStructureCache.websiteId",
  );

  queryClient.setQueryData(
    siteIndexKey(websiteIdKey, state),
    (
      prev: DraftSiteIndexWithRevisionDTO | undefined,
    ): DraftSiteIndexWithRevisionDTO | undefined => {
      if (!prev) return prev;

      return patcher(prev);
    },
  );
}

export function getDraftStructureCache(
  queryClient: QueryClient,
  websiteId: unknown,
  state: ContentState = DEFAULT_CONTENT_STATE,
): DraftSiteIndexWithRevisionDTO | undefined {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "getDraftStructureCache.websiteId",
  );

  return queryClient.getQueryData<DraftSiteIndexWithRevisionDTO>(
    siteIndexKey(websiteIdKey, state),
  );
}
