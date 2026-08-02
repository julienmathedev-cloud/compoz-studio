"use client";

/**
 * @file apps/studio/src/features/pages/conflicts/usePageMetadataConflictPersistence.ts
 * @layer studio/features/pages/conflicts
 * @description Shared metadata-only persistence and commit adapter for both PageForm consumers.
 */

import { useCallback, useMemo, type RefObject } from "react";

import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import {
  executePageMetadataConflictMutation,
  rebasePageMetadataConflictBaseline,
  type PageMetadataConflictCommitNotification,
  type PageMetadataConflictResolutionOutcome,
  type PageMetadataConflictMutationRequest,
  type PageMetadataConflictMutationResult,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import type { PageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type {
  PageEditBaseline,
  PageMetadataOnlyUpdateResult,
} from "@compoz/studio/features/pages/hooks/useUpdatePage";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

type UsePageMetadataConflictPersistenceInput = Readonly<{
  baselineRef: RefObject<PageEditBaseline | null>;
  submittedBaselineRef: RefObject<PageEditBaseline | null>;
  submittedValuesRef: RefObject<PageFormValues | null>;
  resolveMetadataConflict: (
    pageId: string,
    baseline: PageEditBaseline,
    next: PageFormValues,
  ) => Promise<PageMetadataOnlyUpdateResult>;
  adoptCache: (details: PageMetadataConflictDetails) => void;
  close: () => void;
  onResolved: (outcome: PageMetadataConflictResolutionOutcome) => void;
}>;

type PageMetadataConflictPersistence = Readonly<{
  commit: (notification: PageMetadataConflictCommitNotification) => void;
  mutate: (
    request: PageMetadataConflictMutationRequest,
    state: PageMetadataConflictState,
  ) => Promise<PageMetadataConflictMutationResult>;
}>;

export function usePageMetadataConflictPersistence(
  input: UsePageMetadataConflictPersistenceInput,
): PageMetadataConflictPersistence {
  const {
    adoptCache,
    baselineRef,
    close,
    onResolved,
    resolveMetadataConflict,
    submittedBaselineRef,
    submittedValuesRef,
  } = input;

  const commit = useCallback((notification: PageMetadataConflictCommitNotification) => {
    const previous = baselineRef.current;
    if (!previous) throw new Error("Page metadata baseline is unavailable.");
    if (notification.adoptCurrentCache) adoptCache(notification.state.details);
    baselineRef.current = rebasePageMetadataConflictBaseline(
      previous,
      notification.values,
      notification.metaRevision,
    );
    close();
    onResolved(notification.outcome);
  }, [adoptCache, baselineRef, close, onResolved]);

  const mutate = useCallback(async (
    request: PageMetadataConflictMutationRequest,
    state: PageMetadataConflictState,
  ): Promise<PageMetadataConflictMutationResult> => {
    const structuralBaseline = baselineRef.current;
    if (!structuralBaseline) return { status: "error" };
    return executePageMetadataConflictMutation({
      request,
      state,
      structuralBaseline,
      beforeMutation: (baseline, local) => {
        submittedBaselineRef.current = baseline;
        submittedValuesRef.current = local;
      },
      resolve: resolveMetadataConflict,
    });
  }, [baselineRef, resolveMetadataConflict, submittedBaselineRef, submittedValuesRef]);

  return useMemo(() => ({ commit, mutate }), [commit, mutate]);
}
