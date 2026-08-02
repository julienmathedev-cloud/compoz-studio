/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation-cleanup.ts
 * @layer studio/features/pages/conflicts
 * @description Consumer-specific presentation cleanup after a terminal metadata resolution.
 */

import type { PageMetadataConflictResolutionOutcome } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";

type SharedPresentationCleanup = Readonly<{
  clearWarnings: () => void;
  clearBlockingErrors: () => void;
  markSectionClean: () => void;
  clearStructureConflict: () => void;
  remountForm: () => void;
}>;

export function applyPageEditMetadataResolutionPresentationCleanup(
  outcome: PageMetadataConflictResolutionOutcome,
  actions: SharedPresentationCleanup & Readonly<{ closeEditor: () => void }>,
): void {
  if (outcome !== "resolved-with-no-remaining-local-changes") return;
  actions.clearWarnings();
  actions.clearBlockingErrors();
  actions.markSectionClean();
  actions.clearStructureConflict();
  actions.remountForm();
  actions.closeEditor();
}

export function applyPageBlocksMetadataResolutionPresentationCleanup(
  outcome: PageMetadataConflictResolutionOutcome,
  actions: SharedPresentationCleanup,
): void {
  if (outcome !== "resolved-with-no-remaining-local-changes") return;
  actions.clearWarnings();
  actions.clearBlockingErrors();
  actions.markSectionClean();
  actions.clearStructureConflict();
  actions.remountForm();
}
