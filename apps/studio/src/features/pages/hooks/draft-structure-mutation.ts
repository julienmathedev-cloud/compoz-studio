/**
 * @file apps/studio/src/features/pages/hooks/draft-structure-mutation.ts
 * @layer studio/features/pages/hooks
 * @description Shared cache protocol for Website-scoped draft structure mutations.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";
import {
  getDraftStructureConflictDetails,
  type DraftStructureConflictDetails,
} from "@compoz/infra/lib/get-draft-structure-conflict-details";
import {
  getDraftStructureCache,
  setDraftStructureCache,
} from "@compoz/studio/features/site-index/cache";

export const draftStructureMutationKey = (websiteId: unknown) =>
  ["w", String(websiteId ?? "").trim(), "studio", "draftStructure"] as const;

export const draftStructureMutationScope = (websiteId: unknown) => ({
  id: `draft-page-mutations:${String(websiteId ?? "").trim()}`,
});

export const draftStructureMutationOptions = (websiteId: unknown) => ({
  mutationKey: draftStructureMutationKey(websiteId),
  scope: draftStructureMutationScope(websiteId),
});

export function requireDraftStructureSnapshot(
  queryClient: QueryClient,
  websiteId: unknown,
): DraftSiteIndexWithRevisionDTO {
  const snapshot = getDraftStructureCache(
    queryClient,
    websiteId,
    DEFAULT_CONTENT_STATE,
  );
  if (!snapshot) {
    throw new Error("The current draft structure snapshot is unavailable.");
  }
  return snapshot;
}

export function adoptDraftStructureConflict(
  queryClient: QueryClient,
  websiteId: unknown,
  error: unknown,
): boolean {
  const conflict = getDraftStructureConflictDetails(error);
  if (!conflict) return false;

  adoptDraftStructureConflictDetails(
    queryClient,
    websiteId,
    conflict,
  );
  return true;
}

export function adoptDraftStructureConflictDetails(
  queryClient: QueryClient,
  websiteId: unknown,
  conflict: DraftStructureConflictDetails,
): DraftSiteIndexWithRevisionDTO {
  setDraftStructureCache(
    queryClient,
    websiteId,
    DEFAULT_CONTENT_STATE,
    conflict.current,
  );

  return (
    getDraftStructureCache(
      queryClient,
      websiteId,
      DEFAULT_CONTENT_STATE,
    ) ?? conflict.current
  );
}
