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

  const incomingStructureIsNewer =
    incoming.draftStructureRevision > current.draftStructureRevision;
  const structural = incomingStructureIsNewer ? incoming : current;
  const currentById = new Map(
    current.index.pages.map((page) => [page.id, page]),
  );
  const incomingById = new Map(
    incoming.index.pages.map((page) => [page.id, page]),
  );
  let metadataChanged = false;

  const pages = structural.index.pages.map((structuralPage) => {
    const currentPage = currentById.get(structuralPage.id);
    const incomingPage = incomingById.get(structuralPage.id);
    if (!currentPage || !incomingPage) return structuralPage;

    const metadata =
      (incomingPage.metaRevision ?? 0) >
      (currentPage.metaRevision ?? 0)
        ? incomingPage
        : currentPage;
    if (
      metadata.name === structuralPage.name &&
      metadata.slug === structuralPage.slug &&
      metadata.metaRevision === structuralPage.metaRevision
    ) {
      return structuralPage;
    }

    metadataChanged = true;
    return {
      ...structuralPage,
      name: metadata.name,
      slug: metadata.slug,
      metaRevision: metadata.metaRevision,
    };
  });

  if (!metadataChanged) return structural;

  return {
    ...structural,
    index: {
      ...structural.index,
      pages,
      updatedAt:
        incoming.index.updatedAt > current.index.updatedAt
          ? incoming.index.updatedAt
          : current.index.updatedAt,
    },
  };
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
    metaRevision: number;
  }>,
): DraftSiteIndexWithRevisionDTO {
  const adopted = adoptDraftStructureSnapshot(current, incoming);
  const currentPage = adopted.index.pages.find(
    (item) => item.id === page.id,
  );
  if (
    !currentPage ||
    page.metaRevision <= (currentPage.metaRevision ?? 0)
  ) {
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
              slug: page.slug,
              name: page.name,
              metaRevision: page.metaRevision,
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
    metaRevision: number;
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

export function patchDraftPageMetadataCache(
  queryClient: QueryClient,
  websiteId: unknown,
  page: Readonly<{
    id: string;
    slug: string;
    name: string;
    metaRevision: number;
  }>,
  state: ContentState = DEFAULT_CONTENT_STATE,
): void {
  patchDraftStructureCache(
    queryClient,
    websiteId,
    state,
    (current) => {
      const currentPage = current.index.pages.find(
        (item) => item.id === page.id,
      );
      if (
        !currentPage ||
        page.metaRevision <= (currentPage.metaRevision ?? 0)
      ) {
        return current;
      }

      return {
        ...current,
        index: {
          ...current.index,
          pages: current.index.pages.map((item) =>
            item.id === page.id
              ? {
                  ...item,
                  name: page.name,
                  slug: page.slug,
                  metaRevision: page.metaRevision,
                }
              : item,
          ),
        },
      };
    },
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
