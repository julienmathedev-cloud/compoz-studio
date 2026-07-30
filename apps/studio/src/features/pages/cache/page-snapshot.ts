/**
 * @file apps/studio/src/features/pages/cache/page-snapshot.ts
 * @layer studio/features/pages/cache
 * @description Independent monotone metadata and blocks merge preserving structure.
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
  if (!current) return incoming;
  if (
    incoming.revisions.metaRevision <= current.revisions.metaRevision &&
    incoming.revisions.blocksRevision <= current.revisions.blocksRevision
  ) {
    return current;
  }
  const metadata =
    incoming.revisions.metaRevision > current.revisions.metaRevision
      ? mergeMetadata(current.page, incoming.page)
      : current.page;
  const page =
    incoming.revisions.blocksRevision > current.revisions.blocksRevision
      ? { ...metadata, blocks: incoming.page.blocks }
      : metadata;

  return {
    page,
    revisions: {
      metaRevision: Math.max(
        current.revisions.metaRevision,
        incoming.revisions.metaRevision,
      ),
      blocksRevision: Math.max(
        current.revisions.blocksRevision,
        incoming.revisions.blocksRevision,
      ),
    },
  };
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
