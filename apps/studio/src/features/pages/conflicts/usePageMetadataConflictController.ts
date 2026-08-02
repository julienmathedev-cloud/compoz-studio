"use client";

/**
 * @file apps/studio/src/features/pages/conflicts/usePageMetadataConflictController.ts
 * @layer studio/features/pages/conflicts
 * @description Deferred user-decision controller for page metadata OCC conflicts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  pageMetadataConflictCommitOutcome,
  type PageMetadataConflictCommitNotification,
  type PageMetadataConflictMutationRequest,
  type PageMetadataConflictMutationResult,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import {
  choosePageMetadataConflict,
  currentPageMetadataValues,
  hasCompletePageMetadataConflictChoices,
  keepLocalPageMetadataValues,
  pageMetadataConflictId,
  resolvePageMetadataConflictValues,
  type PageMetadataConflictChoices,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type PageMetadataConflictController = Readonly<{
  state: PageMetadataConflictState;
  choices: PageMetadataConflictChoices;
  conflictId: string;
  pending: boolean;
  error?: string;
  canApply: boolean;
  choose: (itemId: string, choice: ConflictResolutionChoice) => void;
  abandon: () => ConflictActionExecutionResult;
  adoptCurrent: () => Promise<ConflictActionExecutionResult>;
  keepLocal: () => Promise<ConflictActionExecutionResult>;
  apply: () => Promise<ConflictActionExecutionResult>;
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
  const [choices, setChoices] = useState<PageMetadataConflictChoices>({});
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string>();
  const actionPendingRef = useRef(false);
  const pending = input.pending || actionPending;

  useEffect(() => {
    setChoices({});
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

  const keepLocal = useCallback(
    () => input.state
      ? executeMutation(keepLocalPageMetadataValues(
          input.state,
          input.getLocalValues().parentId,
        ))
      : Promise.resolve(CONFLICT_ACTION_ERROR),
    [executeMutation, input],
  );

  const apply = useCallback(async (): Promise<ConflictActionExecutionResult> => {
    if (!input.state) return CONFLICT_ACTION_ERROR;
    const resolution = resolvePageMetadataConflictValues({
      state: input.state,
      choices,
      localParentId: input.getLocalValues().parentId,
    });
    if (resolution.status === "incomplete") {
      setError(input.incompleteError);
      return CONFLICT_ACTION_ERROR;
    }
    return executeMutation(resolution.values);
  }, [choices, executeMutation, input]);

  return useMemo(() => input.state && conflictId ? ({
    state: input.state,
    choices,
    conflictId,
    pending,
    error,
    canApply:
      !pending && hasCompletePageMetadataConflictChoices(input.state, choices),
    choose: (itemId: string, choice: ConflictResolutionChoice) => {
      if (pending) return;
      setChoices((current) => choosePageMetadataConflict(
        current,
        itemId as keyof PageMetadataConflictChoices,
        choice,
      ));
      setError(undefined);
    },
    abandon: () => {
      if (pending) return CONFLICT_ACTION_ERROR;
      input.onAbandon();
      return CONFLICT_ACTION_SUCCESS;
    },
    adoptCurrent,
    keepLocal,
    apply,
  }) : null, [adoptCurrent, apply, choices, conflictId, error, input, keepLocal, pending]);
}
