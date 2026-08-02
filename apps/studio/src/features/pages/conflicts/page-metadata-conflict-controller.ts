/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-controller.ts
 * @layer studio/features/pages/conflicts
 * @description Metadata-only success contracts and baseline rebasing helpers.
 */

import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import type { PageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { rebasePageFormMetadataValues } from "@compoz/studio/features/pages/lib/page-form-metadata-commit";
import type {
  PageEditBaseline,
  PageMetadataOnlyUpdateResult,
} from "@compoz/studio/features/pages/hooks/useUpdatePage";
import { toPageFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type PageMetadataConflictMutationRequest = Readonly<{
  pageId: string;
  baseline: PageEditBaseline;
  values: PageFormValues;
}>;

export type PageMetadataConflictResolutionOutcome =
  | "resolved-with-no-remaining-local-changes"
  | "resolved-with-remaining-structure-changes";

export type PageMetadataConflictResolutionSource =
  | "adopt-current"
  | "mutation";

export type PageMetadataConflictCommitNotification = Readonly<{
  source: PageMetadataConflictResolutionSource;
  outcome: PageMetadataConflictResolutionOutcome;
  values: PageFormValues;
  metaRevision: number;
  state: PageMetadataConflictState;
  adoptCurrentCache: boolean;
}>;

export type PageMetadataConflictMutationResult =
  | Readonly<{
      status: "success";
      values: PageFormValues;
      metaRevision: number;
      adoptCurrentCache: boolean;
    }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "error" }>;

export function pageMetadataConflictCommitOutcome(input: Readonly<{
  structuralBaselineParentId: PageFormValues["parentId"];
  localParentId: PageFormValues["parentId"];
}>): PageMetadataConflictResolutionOutcome {
  return input.structuralBaselineParentId === input.localParentId
    ? "resolved-with-no-remaining-local-changes"
    : "resolved-with-remaining-structure-changes";
}

export function rebasePageMetadataConflictBaseline(
  previous: PageEditBaseline,
  metadataValues: PageFormValues,
  metaRevision: number,
): PageEditBaseline {
  return {
    values: rebasePageFormMetadataValues(previous.values, metadataValues),
    metaRevision,
  };
}

export function toPageMetadataMutationSuccess(
  response: UpdatePageResponse,
  localParentId: PageFormValues["parentId"],
): Extract<PageMetadataConflictMutationResult, { status: "success" }> {
  return {
    status: "success",
    values: {
      ...toPageFormValuesFromDTO(response.page),
      parentId: localParentId,
    },
    metaRevision: response.revisions.metaRevision,
    adoptCurrentCache: false,
  };
}

export async function executePageMetadataConflictMutation(input: Readonly<{
  request: PageMetadataConflictMutationRequest;
  state: PageMetadataConflictState;
  structuralBaseline: PageEditBaseline;
  beforeMutation: (
    baseline: PageEditBaseline,
    local: PageFormValues,
  ) => void;
  resolve: (
    pageId: string,
    baseline: PageEditBaseline,
    next: PageFormValues,
  ) => Promise<PageMetadataOnlyUpdateResult>;
}>): Promise<PageMetadataConflictMutationResult> {
  const mutationBaseline = rebasePageMetadataConflictBaseline(
    input.structuralBaseline,
    input.request.baseline.values,
    input.request.baseline.metaRevision,
  );
  const mutationValues = rebasePageFormMetadataValues(
    mutationBaseline.values,
    input.request.values,
  );
  input.beforeMutation(mutationBaseline, input.request.values);

  const result = await input.resolve(
    input.request.pageId,
    mutationBaseline,
    mutationValues,
  );
  if (result.status === "metadataConflict") return { status: "conflict" };
  if (result.status === "ignored") return { status: "error" };
  if (result.status === "submitted") {
    return toPageMetadataMutationSuccess(
      result.response,
      input.request.values.parentId,
    );
  }
  return {
    status: "success",
    values: input.request.values,
    metaRevision: input.state.details.currentMetaRevision,
    adoptCurrentCache: true,
  };
}
