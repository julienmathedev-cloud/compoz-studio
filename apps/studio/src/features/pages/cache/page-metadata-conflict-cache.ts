/**
 * @file apps/studio/src/features/pages/cache/page-metadata-conflict-cache.ts
 * @layer studio/features/pages/cache
 * @description Cache-only adoption of explicitly accepted remote page metadata.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import {
  adoptPageMetadataSnapshot,
  patchPageStructureParent,
  resolvePageStructureParent,
} from "@compoz/studio/features/pages/cache/page-snapshot";
import {
  getDraftStructureCache,
  patchDraftPageMetadataCache,
} from "@compoz/studio/features/site-index/cache";

export function adoptPageMetadataConflictCurrentCache(
  queryClient: QueryClient,
  websiteId: string,
  details: PageMetadataConflictDetails,
  state: ContentState = DEFAULT_CONTENT_STATE,
): void {
  const pageId = details.current.page.id;
  const structure = getDraftStructureCache(
    queryClient,
    websiteId,
    state,
  );
  const incoming: PageWithRevisionsDTO = {
    page: details.current.page,
    revisions: {
      ...details.current.revisions,
      metaRevision: details.currentMetaRevision,
    },
  };

  queryClient.setQueryData(
    pageByIdKey(websiteId, pageId, state),
    (current: PageWithRevisionsDTO | undefined) => {
      const adopted = adoptPageMetadataSnapshot(current, incoming);
      const structuralParent = resolvePageStructureParent(
        structure?.index.pages,
        pageId,
        current?.page.parentId,
      );

      return structuralParent === undefined
        ? adopted
        : patchPageStructureParent(adopted, structuralParent);
    },
  );

  patchDraftPageMetadataCache(
    queryClient,
    websiteId,
    {
      id: pageId,
      name: details.current.page.name,
      slug: details.current.page.slug,
      metaRevision: details.currentMetaRevision,
    },
    state,
  );
}
