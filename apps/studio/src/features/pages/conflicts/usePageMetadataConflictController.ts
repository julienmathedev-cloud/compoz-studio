"use client";

/**
 * @file apps/studio/src/features/pages/conflicts/usePageMetadataConflictController.ts
 * @layer studio/features/pages/conflicts
 * @description Deferred user-decision controller for page metadata OCC conflicts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";

import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import type { ConflictResolutionChoices } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  pageMetadataConflictCommitOutcome,
  type PageMetadataConflictCommitNotification,
  type PageMetadataConflictMutationRequest,
  type PageMetadataConflictMutationResult,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import {
  currentPageMetadataValues,
  PAGE_METADATA_CONFLICT_FIELDS,
  pageMetadataConflictId,
  resolvePageMetadataConflictValues,
  type PageMetadataConflictChoices,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type PageMetadataConflictController = Readonly<{
  state: PageMetadataConflictState;
  conflictId: string;
  pending: boolean;
  error?: string;
  abandon: () => ConflictActionExecutionResult;
  apply: (
    choices: ConflictResolutionChoices,
  ) => Promise<ConflictActionExecutionResult>;
}>;

type UsePageMetadataConflictControllerInput = Readonly<{
  state: PageMetadataConflictState | null;
  pending: boolean;
  incompleteError: string;
  mutationError: string;
  getLocalValues: () => PageFormValues;
  commitValues: (values: PageFormValues) => void;
  onAbandon: () => void;
  onCommit: (notification: PageMetadataConflictCommitNotification) => void;
  onMutate: (
    request: PageMetadataConflictMutationRequest,
    state: PageMetadataConflictState,
  ) => Promise<PageMetadataConflictMutationResult>;
}>;

export function usePageMetadataConflictController(
  input: UsePageMetadataConflictControllerInput,
): PageMetadataConflictController | null {
  const conflictId = input.state ? pageMetadataConflictId(input.state) : null;
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string>();
  const actionPendingRef = useRef(false);
  const pending = input.pending || actionPending;

  useEffect(() => {
    setError(undefined);
    actionPendingRef.current = false;
    setActionPending(false);
  }, [conflictId]);

  const beginAction = useCallback((): boolean => {
    if (input.pending || actionPendingRef.current) return false;
    actionPendingRef.current = true;
    setActionPending(true);
    setError(undefined);
    return true;
  }, [input.pending]);

  const endAction = useCallback(() => {
    actionPendingRef.current = false;
    setActionPending(false);
  }, []);

  const executeMutation = useCallback(async (
    values: PageFormValues,
  ): Promise<ConflictActionExecutionResult> => {
    if (!input.state) return CONFLICT_ACTION_ERROR;
    if (!beginAction()) return CONFLICT_ACTION_ERROR;
    const localParentId = input.getLocalValues().parentId;
    try {
      const result = await input.onMutate({
        pageId: input.state.details.current.page.id,
        baseline: {
          values: currentPageMetadataValues(input.state, localParentId),
          metaRevision: input.state.details.currentMetaRevision,
        },
        values: { ...values, parentId: localParentId },
      }, input.state);
      if (result.status !== "success") {
        if (result.status === "error") setError(input.mutationError);
        return CONFLICT_ACTION_ERROR;
      }
      input.commitValues(result.values);
      input.onCommit({
        source: "mutation",
        outcome: pageMetadataConflictCommitOutcome({
          structuralBaselineParentId: input.state.baseline.parentId,
          localParentId,
        }),
        values: result.values,
        metaRevision: result.metaRevision,
        state: input.state,
        adoptCurrentCache: result.adoptCurrentCache,
      });
      return CONFLICT_ACTION_SUCCESS;
    } catch {
      setError(input.mutationError);
      return CONFLICT_ACTION_ERROR;
    } finally {
      endAction();
    }
  }, [beginAction, endAction, input]);

  const adoptCurrent = useCallback(async (): Promise<ConflictActionExecutionResult> => {
    if (!input.state) return CONFLICT_ACTION_ERROR;
    if (!beginAction()) return CONFLICT_ACTION_ERROR;
    try {
      const localParentId = input.getLocalValues().parentId;
      const values = currentPageMetadataValues(input.state, localParentId);
      input.commitValues(values);
      input.onCommit({
        source: "adopt-current",
        outcome: pageMetadataConflictCommitOutcome({
          structuralBaselineParentId: input.state.baseline.parentId,
          localParentId,
        }),
        values,
        metaRevision: input.state.details.currentMetaRevision,
        state: input.state,
        adoptCurrentCache: true,
      });
      return CONFLICT_ACTION_SUCCESS;
    } catch {
      setError(input.mutationError);
      return CONFLICT_ACTION_ERROR;
    } finally {
      endAction();
    }
  }, [beginAction, endAction, input]);

  const apply = useCallback(async (
    choices: ConflictResolutionChoices,
  ): Promise<ConflictActionExecutionResult> => {
    if (!input.state) return CONFLICT_ACTION_ERROR;
    const resolution = resolvePageMetadataConflictValues({
      state: input.state,
      choices: choices as PageMetadataConflictChoices,
      localParentId: input.getLocalValues().parentId,
    });
    if (resolution.status === "incomplete") {
      setError(input.incompleteError);
      return CONFLICT_ACTION_ERROR;
    }
    const current = currentPageMetadataValues(
      input.state,
      input.getLocalValues().parentId,
    );
    const usesOnlyCurrentMetadata = PAGE_METADATA_CONFLICT_FIELDS.every(
      (field) => equalJsonValue(resolution.values[field], current[field]),
    );
    if (usesOnlyCurrentMetadata) return adoptCurrent();
    return executeMutation(resolution.values);
  }, [adoptCurrent, executeMutation, input]);

  return useMemo(() => input.state && conflictId ? ({
    state: input.state,
    conflictId,
    pending,
    error,
    abandon: () => {
      if (pending) return CONFLICT_ACTION_ERROR;
      input.onAbandon();
      return CONFLICT_ACTION_SUCCESS;
    },
    apply,
  }) : null, [apply, conflictId, error, input, pending]);
}
