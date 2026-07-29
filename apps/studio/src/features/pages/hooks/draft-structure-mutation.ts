/**
 * @file apps/studio/src/features/pages/hooks/draft-structure-mutation.ts
 * @layer studio/features/pages/hooks
 * @description Shared cache protocol for Website-scoped draft structure mutations.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { getDraftStructureConflictDetails } from "@compoz/infra/lib/get-draft-structure-conflict-details";
import { getRevisionConflictDetails } from "@compoz/infra/lib/get-revision-conflict-details";
import {
  getDraftStructureCache,
  setDraftStructureCache,
} from "@compoz/studio/features/site-index/cache";
import { isSettingsBundle } from "@compoz/studio/features/settings/bundle/cache";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

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

  setDraftStructureCache(
    queryClient,
    websiteId,
    DEFAULT_CONTENT_STATE,
    conflict.current,
  );
  return true;
}

export async function refreshMenuSettingsAfterConflict(
  queryClient: QueryClient,
  websiteId: string,
  error: unknown,
): Promise<boolean> {
  const conflict = getRevisionConflictDetails(error);
  if (
    !conflict ||
    (conflict.resourceId !== "primaryMenu" &&
      conflict.resourceId !== "legalMenu")
  ) {
    return false;
  }

  await queryClient.invalidateQueries({
    queryKey: settingsBundleKey(
      websiteId,
      DEFAULT_CONTENT_STATE,
    ),
    exact: true,
    refetchType: "all",
  });
  return true;
}

export async function resolveMenuRenameExpectedRevisions(
  queryClient: QueryClient,
  websiteId: string,
): Promise<
  Readonly<{
    expectedPrimaryMenuRevision: number;
    expectedLegalMenuRevision: number;
  }>
> {
  const cached = queryClient.getQueryData(
    settingsBundleKey(websiteId, DEFAULT_CONTENT_STATE),
  );
  const bundle = isSettingsBundle(cached)
    ? cached
    : await settingsStudioApi.bundle.get(DEFAULT_CONTENT_STATE);

  if (!isSettingsBundle(bundle)) {
    throw new Error("settings-bundle: invalid revision snapshot");
  }

  return {
    expectedPrimaryMenuRevision:
      bundle.revisions.primaryMenuRevision,
    expectedLegalMenuRevision: bundle.revisions.legalMenuRevision,
  };
}
