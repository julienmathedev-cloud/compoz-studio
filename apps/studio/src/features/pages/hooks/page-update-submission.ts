/**
 * @file apps/studio/src/features/pages/hooks/page-update-submission.ts
 * @layer studio/features/pages/hooks
 * @description Converts expected page OCC rejections into explicit submit outcomes.
 */

import {
  getDraftStructureConflictDetails,
  type DraftStructureConflictDetails,
} from "@compoz/infra/lib/get-draft-structure-conflict-details";
import {
  getPageMetadataConflictDetails,
  type PageMetadataConflictDetails,
} from "@compoz/infra/lib/get-page-metadata-conflict-details";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export type UpdatePageSubmissionOutcome =
  | "submitted"
  | "noChanges"
  | "metadataConflict"
  | "structureConflict"
  | "ignored";

export type PageUpdateCompletionMode = "normal" | "metadata-only";

export function shouldRunNormalPageUpdateSuccess(
  completion: PageUpdateCompletionMode,
): boolean {
  return completion === "normal";
}

export type PageUpdateMutationOutcome = Extract<
  UpdatePageSubmissionOutcome,
  "submitted" | "noChanges" | "metadataConflict" | "structureConflict"
>;

export function shouldApplyPageUpdateSuccessCleanup(
  outcome: UpdatePageSubmissionOutcome,
): boolean {
  return outcome === "submitted" || outcome === "noChanges";
}

export async function submitPageUpdateMutation(input: Readonly<{
  mutate: () => Promise<Readonly<{ response: Readonly<{ outcome: MutationOutcome }> }>>;
  onMetadataConflict?: (details: PageMetadataConflictDetails) => void;
  onStructureConflict?: (
    details: DraftStructureConflictDetails,
    error: unknown,
  ) => void;
  onUnexpectedError: (error: unknown) => void;
}>): Promise<PageUpdateMutationOutcome> {
  try {
    const result = await input.mutate();
    return result.response.outcome === "noChanges" ? "noChanges" : "submitted";
  } catch (error) {
    const metadataConflict = getPageMetadataConflictDetails(error);
    if (metadataConflict) {
      input.onMetadataConflict?.(metadataConflict);
      return "metadataConflict";
    }

    const structureConflict = getDraftStructureConflictDetails(error);
    if (structureConflict) {
      input.onStructureConflict?.(structureConflict, error);
      return "structureConflict";
    }

    input.onUnexpectedError(error);
    throw error;
  }
}
