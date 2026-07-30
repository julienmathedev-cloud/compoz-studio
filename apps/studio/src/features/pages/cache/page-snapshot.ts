/**
 * @file apps/studio/src/features/pages/cache/page-snapshot.ts
 * @layer studio/features/pages/cache
 * @description Monotone metadata merge that preserves client-managed blocks and structure.
 */

import type {
  PageDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";

type PageStructureParent = Readonly<{
  id: string;
  parentId: string | null;
}>;

function mergeMetadata(
  current: PageDTO,
  metadataSource: PageDTO,
): PageDTO {
  return {
    ...current,
    name: metadataSource.name,
    slug: metadataSource.slug,
    seoTitle: metadataSource.seoTitle,
    seoDescription: metadataSource.seoDescription,
    sitemap: metadataSource.sitemap,
    paginationEnabled: metadataSource.paginationEnabled,
  };
}

export function mergePageRevisionedSnapshot(
  current: PageWithRevisionsDTO | undefined,
  incoming: PageWithRevisionsDTO,
): PageWithRevisionsDTO {
  return adoptPageMetadataSnapshot(current, incoming);
}

export function adoptPageMetadataSnapshot(
  current: PageWithRevisionsDTO | undefined,
  incoming: PageWithRevisionsDTO,
): PageWithRevisionsDTO {
  if (!current) return incoming;
  if (
    incoming.revisions.metaRevision <= current.revisions.metaRevision
  ) {
    return current;
  }

  return {
    page: mergeMetadata(current.page, incoming.page),
    revisions: {
      metaRevision: incoming.revisions.metaRevision,
      blocksRevision: current.revisions.blocksRevision,
    },
  };
}

export function patchPageStructureParent(
  current: PageWithRevisionsDTO | undefined,
  parentId: string | null,
): PageWithRevisionsDTO | undefined {
  if (!current || current.page.parentId === parentId) return current;

  return {
    ...current,
    page: {
      ...current.page,
      parentId,
    },
  };
}

export function resolvePageStructureParent(
  pages: ReadonlyArray<PageStructureParent> | undefined,
  pageId: string,
  fallbackParentId: string | null | undefined,
): string | null | undefined {
  const structuralParent = pages?.find(
    (page) => page.id === pageId,
  )?.parentId;

  return structuralParent === undefined
    ? fallbackParentId
    : structuralParent;
}
