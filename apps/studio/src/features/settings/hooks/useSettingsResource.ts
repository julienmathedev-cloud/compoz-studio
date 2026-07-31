"use client";

/**
 * @file apps/studio/src/features/settings/hooks/useSettingsResource.ts
 * @layer studio/features/settings/hooks
 *
 * @description
 * Generic settings resource hook for baseline loading and draft saves.
 *
 * @remarks
 * - Deduplicates identical loads and aborts stale loads when the requested content state changes.
 * - Saves always target draft state; reads may target draft or published state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { isAbortError, newAbort } from "@compoz/infra/http/abort-error";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { logSpan } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { getRevisionConflictDetails } from "@compoz/infra/lib/get-revision-conflict-details";
import {
  canApplyConflictResolution,
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
  type ConflictPresentationGroup,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  buildSettingsConflictMutationPlan,
  buildSettingsWholeLocalMutationPlan,
  toSettingsConflictPresentation,
  type SettingsConflictMutationPlan,
  type SettingsConflictPresentationAdapter,
  type SettingsConflictSnapshot,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";
import {
  isSettingsConflictPending,
  transitionSettingsConflict,
  type SettingsConflictFreshCurrent,
  type SettingsConflictMachineState,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-machine";
import {
  executeSettingsConflictApply,
  executeSettingsCurrentAdoption,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-execution";
import {
  settingsConflictId,
  type SettingsConflictScope,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-id";

/** Minimal translation function contract compatible with next-intl. */
export type TFunc = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Save result distinguishing skipped no-op saves from persisted values. */
export type SettingsSaveResult<T> =
  | Readonly<{ status: "noChanges"; fields: ReadonlyArray<string> }>
  | Readonly<{ status: "saved"; value: T; fields: ReadonlyArray<string> }>
  | Readonly<{ status: "conflict" }>;

export type FreshSettingsSection<T extends object> = SettingsConflictFreshCurrent<T>;

export type SettingsConflictController = Readonly<{
  conflictId: string;
  groups: readonly ConflictPresentationGroup[];
  pending: boolean;
  error?: string;
  canResolve: boolean;
  canApply: boolean;
  canKeepLocal: boolean;
  choose: (itemId: string, choice: ConflictResolutionChoice) => void;
  abandon: () => ConflictActionExecutionResult;
  adoptCurrent: () => Promise<ConflictActionExecutionResult>;
  keepLocal: () => Promise<ConflictActionExecutionResult>;
  apply: () => Promise<ConflictActionExecutionResult>;
  retryFreshRead: () => Promise<ConflictActionExecutionResult>;
}>;

export type SettingsHookResult<T extends object> = Readonly<{
  baseline: T;
  isLoading: boolean;
  isSaving: boolean;
  conflict: SettingsConflictController | null;

  load: (state?: ContentState) => Promise<T>;

  /** Saves next values, optionally skipping the network call when the computed patch is empty. */
  save: (nextValues: T) => Promise<SettingsSaveResult<T>>;
}>;

type UseSettingsResourceParams<T extends object> = Readonly<{
  defaults: T;
  entityLabel: string;
  load: (state: ContentState, opts?: HttpOpts) => Promise<T>;
  save: (next: Partial<T> | T, opts?: HttpOpts) => Promise<T>;
  onLoaded?: (value: T) => T | void;
  onSaved?: (value: T) => void;
  beforeSave?: (value: T) => Partial<T> | T;
  buildPatch?: (baseline: T, next: T) => Partial<T> | null;
  autoLoad?: boolean;
  conflict?: Readonly<{
    scope: SettingsConflictScope;
    fetchCurrent: (signal: AbortSignal) => Promise<FreshSettingsSection<T>>;
    adoptSnapshot: (value: T, revision: number) => () => void;
    presentation: SettingsConflictPresentationAdapter<T>;
    messages: Readonly<{
      freshReadFailed: string;
      incomplete: string;
      mutationFailed: string;
    }>;
  }>;
}>;

/** Adds standard settings save toasts without calling hooks inside the wrapper.*/
export function wrapSettingsSaveWithToasts<T extends object>(
  params: Readonly<{
    t: TFunc;
    entityLabel: string;
    save: (nextValues: T) => Promise<SettingsSaveResult<T>>;
  }>,
): (nextValues: T) => Promise<SettingsSaveResult<T>> {
  const { t, entityLabel, save } = params;

  return async (nextValues: T) => {
    const result = await save(nextValues);

    if (result.status === "conflict") return result;

    if (result.status === "noChanges") {
      notifyNoChanges(
        t("notifications.noChanges.title", { entity: entityLabel }),
        t("notifications.noChanges.description", { entity: entityLabel }),
      );

      return result;
    }

    notifyUpdated(
      t("notifications.updated.title", { entity: entityLabel }),
      t("notifications.updated.description", {
        fields: result.fields.join(", "),
      }),
    );

    return result;
  };
}

export function useSettingsResource<T extends object>({
  defaults,
  entityLabel,
  load: loader,
  save: saver,
  onLoaded,
  onSaved,
  beforeSave,
  buildPatch,
  autoLoad = true,
  conflict: conflictConfig,
}: UseSettingsResourceParams<T>): SettingsHookResult<T> {
  const [baseline, setBaseline] = useState<T>(defaults);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(autoLoad));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  type ActiveConflict = Exclude<SettingsConflictMachineState<T>, { phase: "idle" }>;
  const [internalConflict, setInternalConflict] = useState<SettingsConflictMachineState<T>>({ phase: "idle" });
  const conflictSequenceRef = useRef(0);
  const conflictActionPendingRef = useRef(false);

  const ctrlRef = useRef<AbortController | null>(null);
  const pendingLoadsRef = useRef<number>(0);

  /** Reuses identical in-flight loads and aborts stale loads for different states. */
  const inFlightLoadRef = useRef<{
    state: ContentState;
    promise: Promise<T>;
    ctrl: AbortController;
  } | null>(null);

  const abortCurrent = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  const loaderRef = useRef(loader);
  const saverRef = useRef(saver);
  const onLoadedRef = useRef(onLoaded);
  const onSavedRef = useRef(onSaved);
  const beforeSaveRef = useRef(beforeSave);
  const buildPatchRef = useRef(buildPatch);
  const entityLabelRef = useRef(entityLabel);
  const conflictConfigRef = useRef(conflictConfig);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    saverRef.current = saver;
  }, [saver]);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    beforeSaveRef.current = beforeSave;
  }, [beforeSave]);

  useEffect(() => {
    buildPatchRef.current = buildPatch;
  }, [buildPatch]);

  useEffect(() => {
    entityLabelRef.current = entityLabel;
  }, [entityLabel]);

  useEffect(() => {
    conflictConfigRef.current = conflictConfig;
  }, [conflictConfig]);

  const fetchConflictCurrent = useCallback(async (
    state: ActiveConflict,
  ): Promise<ConflictActionExecutionResult> => {
    const config = conflictConfigRef.current;
    if (!config || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
    const loadingState = state.phase === "loadingCurrent"
      ? state
      : transitionSettingsConflict(state, { type: "startFreshRead" });
    if (loadingState.phase !== "loadingCurrent") return CONFLICT_ACTION_ERROR;
    conflictActionPendingRef.current = true;
    const controller = newAbort();
    ctrlRef.current = controller;
    setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
      ? loadingState
      : current);
    try {
      const current = await config.fetchCurrent(controller.signal);
      setInternalConflict((active) => active.phase !== "idle" && active.conflictId === state.conflictId
        ? transitionSettingsConflict(active, { type: "freshReadSucceeded", current })
        : active);
      return CONFLICT_ACTION_SUCCESS;
    } catch {
      setInternalConflict((active) => active.phase !== "idle" && active.conflictId === state.conflictId
        ? transitionSettingsConflict(active, { type: "freshReadFailed", error: config.messages.freshReadFailed })
        : active);
      return CONFLICT_ACTION_ERROR;
    } finally {
      if (ctrlRef.current === controller) ctrlRef.current = null;
      conflictActionPendingRef.current = false;
    }
  }, []);

  const load = useCallback(
    async (nextState?: ContentState) => {
      const state: ContentState = nextState ?? DEFAULT_CONTENT_STATE;

      // Reuse an identical in-flight load instead of starting a duplicate request.
      const inFlight = inFlightLoadRef.current;
      if (inFlight && inFlight.state === state) {
        return inFlight.promise;
      }

      // Different state: abort the previous load and start a fresh cycle.
      abortCurrent();

      const abortController = newAbort();
      ctrlRef.current = abortController;

      pendingLoadsRef.current += 1;
      setIsLoading(true);

      const promise = (async () => {
        try {
          const data = await logSpan(
            "ui.settingsResource.load",
            { state, entity: entityLabelRef.current },
            () => loaderRef.current(state, { signal: abortController.signal }),
          );

          const normalized = (onLoadedRef.current?.(data) ?? data) as T;
          setBaseline(normalized);

          return normalized;
        } catch (error: unknown) {
          if (!isAbortError(error)) {
            notify.fromError(error);
          }

          throw error;
        } finally {
          pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);

          if (pendingLoadsRef.current === 0) {
            setIsLoading(false);
          }

          if (ctrlRef.current === abortController) {
            ctrlRef.current = null;
          }

          if (inFlightLoadRef.current?.ctrl === abortController) {
            inFlightLoadRef.current = null;
          }
        }
      })();

      inFlightLoadRef.current = {
        state,
        promise,
        ctrl: abortController,
      };

      return promise;
    },
    [abortCurrent],
  );

  const save = useCallback(
    async (nextValues: T): Promise<SettingsSaveResult<T>> => {
      abortCurrent();

      const abortController = newAbort();
      ctrlRef.current = abortController;

      setIsSaving(true);
      let attemptedLocal = nextValues;

      try {
        const beforeSaveFn = beforeSaveRef.current;
        const buildPatchFn = buildPatchRef.current;
        const saverFn = saverRef.current;
        const onSavedFn = onSavedRef.current;

        const candidate = (
          beforeSaveFn ? beforeSaveFn(nextValues) : nextValues
        ) as T;
        attemptedLocal = candidate;

        const payload: Partial<T> | T =
          buildPatchFn?.(baseline, candidate) ?? candidate;

        const fields = buildPatchFn
          ? Object.keys(payload as Record<string, unknown>)
          : Object.keys(candidate as Record<string, unknown>);

        // Empty computed patch: skip the network call.
        if (buildPatchFn && fields.length === 0) {
          return { status: "noChanges", fields: [] } as const;
        }

        const saved = await logSpan(
          "ui.settingsResource.save",
          {
            state: DEFAULT_CONTENT_STATE,
            entity: entityLabelRef.current,
            fields,
          },
          () => saverFn(payload, { signal: abortController.signal }),
        );

        setBaseline(saved);
        onSavedFn?.(saved);

        return { status: "saved", value: saved, fields } as const;
      } catch (error: unknown) {
        const config = conflictConfigRef.current;
        const details = config ? getRevisionConflictDetails(error) : null;
        if (config && details) {
          const opened = transitionSettingsConflict<T>({ phase: "idle" }, {
            type: "open",
            conflictId: settingsConflictId(
              config.scope,
              ++conflictSequenceRef.current,
              details.currentRevision,
            ),
            baseline: structuredClone(baseline),
            local: structuredClone(attemptedLocal),
          });
          if (opened.phase === "idle") throw error;
          const state = opened;
          setInternalConflict(state);
          await fetchConflictCurrent(state);
          return { status: "conflict" };
        }
        notify.fromError(error, UiError.unexpectedSave);
        throw error;
      } finally {
        setIsSaving(false);
        ctrlRef.current = null;
      }
    },
    [baseline, abortCurrent, fetchConflictCurrent],
  );

  const conflict = useMemo<SettingsConflictController | null>(() => {
    const state = internalConflict;
    const config = conflictConfig;
    if (state.phase === "idle" || !config) return null;
    const snapshot: SettingsConflictSnapshot<T> | null = state.current ? {
      baseline: state.baseline,
      local: state.local,
      current: state.current.value,
      currentRevision: state.current.revision,
    } : null;
    const groups = snapshot
      ? toSettingsConflictPresentation({ ...config.presentation, snapshot, choices: state.choices })
      : [];

    const adoptCurrent = async (): Promise<ConflictActionExecutionResult> => {
      if (!state.current || isSettingsConflictPending(state) || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
      conflictActionPendingRef.current = true;
      setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
        ? transitionSettingsConflict(current, { type: "startAdoptingCurrent" })
        : current);
      try {
        const result = await executeSettingsCurrentAdoption({
          current: state.current,
          adoptSnapshot: config.adoptSnapshot,
          commit: (value) => {
            setBaseline(structuredClone(value));
            onSavedRef.current?.(value);
          },
        });
        if (result.status === "error") {
          setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
            ? transitionSettingsConflict(current, { type: "mutationFailed", error: config.messages.mutationFailed })
            : current);
          return CONFLICT_ACTION_ERROR;
        }
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "complete" })
          : current);
        return CONFLICT_ACTION_SUCCESS;
      } catch {
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "mutationFailed", error: config.messages.mutationFailed })
          : current);
        return CONFLICT_ACTION_ERROR;
      } finally {
        conflictActionPendingRef.current = false;
      }
    };

    type ExecutablePlan = Exclude<SettingsConflictMutationPlan<T>, { status: "incomplete" | "manual" }>;
    const executePlan = async (plan: ExecutablePlan): Promise<ConflictActionExecutionResult> => {
      if (!state.current || isSettingsConflictPending(state) || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
      const conflictCurrent = state.current;
      conflictActionPendingRef.current = true;
      setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
        ? transitionSettingsConflict(current, { type: "startApply" })
        : current);
      const mutationController = newAbort();
      ctrlRef.current = mutationController;
      try {
        const execution = await executeSettingsConflictApply({
          plan,
          current: conflictCurrent,
          signal: mutationController.signal,
          adoptSnapshot: config.adoptSnapshot,
          mutate: (payload, signal) => saverRef.current(payload, { signal }),
          commit: (value) => {
            setBaseline(value);
            onSavedRef.current?.(value);
          },
        });
        if (execution.status === "error") throw execution.error;
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "complete" })
          : current);
        return CONFLICT_ACTION_SUCCESS;
      } catch (error: unknown) {
        const nextDetails = getRevisionConflictDetails(error);
        if (nextDetails) {
          setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
            ? transitionSettingsConflict(current, { type: "secondConflict", baseline: conflictCurrent.value, local: plan.value, error: config.messages.mutationFailed })
            : current);
        } else {
          setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
            ? transitionSettingsConflict(current, { type: "mutationFailed", error: config.messages.mutationFailed })
            : current);
        }
        return CONFLICT_ACTION_ERROR;
      } finally {
        if (ctrlRef.current === mutationController) ctrlRef.current = null;
        conflictActionPendingRef.current = false;
      }
    };

    const apply = async (): Promise<ConflictActionExecutionResult> => {
      if (!snapshot || isSettingsConflictPending(state) || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
      const plan = buildSettingsConflictMutationPlan({
        snapshot,
        choices: state.choices,
        normalize: beforeSaveRef.current
          ? (value) => beforeSaveRef.current?.(value) as T
          : undefined,
        fields: config.presentation,
      });
      if (plan.status === "incomplete" || plan.status === "manual") {
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "validationFailed", error: config.messages.incomplete })
          : current);
        return CONFLICT_ACTION_ERROR;
      }
      return executePlan(plan);
    };

    const keepLocal = async (): Promise<ConflictActionExecutionResult> => {
      if (!snapshot || isSettingsConflictPending(state) || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
      return executePlan(buildSettingsWholeLocalMutationPlan({
        snapshot,
        normalize: beforeSaveRef.current
          ? (value) => beforeSaveRef.current?.(value) as T
          : undefined,
        fields: config.presentation,
      }));
    };

    const hasManualResolution = groups.some((group) =>
      group.items.some((item) => item.resolutionMode === "manual"),
    );

    return {
      conflictId: state.conflictId,
      groups,
      pending: isSettingsConflictPending(state),
      error: state.error,
      canResolve: snapshot !== null,
      canApply: snapshot !== null && canApplyConflictResolution(groups, isSettingsConflictPending(state)),
      canKeepLocal: snapshot !== null && hasManualResolution && !isSettingsConflictPending(state),
      choose: (itemId, choice) => setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
        ? transitionSettingsConflict(current, { type: "choose", itemId, choice })
        : current),
      abandon: () => {
        if (isSettingsConflictPending(state)) return CONFLICT_ACTION_ERROR;
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "abandon" })
          : current);
        return CONFLICT_ACTION_SUCCESS;
      },
      adoptCurrent,
      keepLocal,
      apply,
      retryFreshRead: () => fetchConflictCurrent(state),
    };
  }, [conflictConfig, fetchConflictCurrent, internalConflict]);

  useEffect(() => {
    if (!autoLoad) return;

    load().catch(() => void 0);
  }, [autoLoad, load]);

  useEffect(() => abortCurrent, [abortCurrent]);

  return useMemo(
    () =>
      ({
        baseline,
        isLoading,
        isSaving,
        conflict,
        load,
        save,
      }) as const,
    [baseline, conflict, isLoading, isSaving, load, save],
  );
}
