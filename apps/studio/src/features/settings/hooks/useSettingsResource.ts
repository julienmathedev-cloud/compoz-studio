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
  notifyAutomaticMerge,
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { getRevisionConflictDetails } from "@compoz/infra/lib/get-revision-conflict-details";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
  type ConflictPresentationGroup,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import type { ConflictResolutionChoices } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  buildSettingsConflictMutationPlan,
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
import { executeSettingsConflictApply } from "@compoz/studio/features/settings/conflicts/settings-conflict-execution";
import { executeSettingsAutomaticRebase } from "@compoz/studio/features/settings/conflicts/settings-conflict-auto-rebase";
import {
  settingsConflictId,
  type SettingsConflictScope,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-id";
import {
  canReuseSettingsLoad,
  type InFlightSettingsLoad,
} from "@compoz/studio/features/settings/hooks/settings-load-deduplication";
import { SettingsSaveDeduplicator } from "@compoz/studio/features/settings/hooks/settings-save-deduplication";
import {
  AUTOMATIC_MERGE_NOTIFICATION,
  settingsSaveNotificationFor,
} from "@compoz/studio/features/settings/hooks/settings-save-notification";

/** Minimal translation function contract compatible with next-intl. */
export type TFunc = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Save result distinguishing skipped no-op saves from persisted values. */
export type SettingsSaveResult<T> =
  | Readonly<{
      status: "noChanges";
      fields: ReadonlyArray<string>;
      value?: T;
      notification?: typeof AUTOMATIC_MERGE_NOTIFICATION;
    }>
  | Readonly<{
      status: "saved";
      value: T;
      fields: ReadonlyArray<string>;
      notification?: typeof AUTOMATIC_MERGE_NOTIFICATION;
    }>
  | Readonly<{ status: "conflict" }>;

export type FreshSettingsSection<T extends object> = SettingsConflictFreshCurrent<T>;

export type SettingsConflictController = Readonly<{
  conflictId: string;
  groups: readonly ConflictPresentationGroup[];
  pending: boolean;
  error?: string;
  canResolve: boolean;
  abandon: () => ConflictActionExecutionResult;
  apply: (
    choices: ConflictResolutionChoices,
  ) => Promise<ConflictActionExecutionResult>;
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
  save: (next: Partial<T> | T, opts?: HttpOpts) => Promise<Readonly<{ value: T; outcome: MutationOutcome }>>;
  onLoaded?: (value: T) => T | void;
  onMutationResult?: (value: T, outcome: MutationOutcome) => void;
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
  const deduplicator = new SettingsSaveDeduplicator<SettingsSaveResult<T>>();

  return (nextValues: T) => deduplicator.run(async () => {
    const result = await save(nextValues);

    const notification = settingsSaveNotificationFor(result);

    if (notification?.kind === "automaticMerge") {
      notifyAutomaticMerge(
        t("notifications.automaticMerge.title"),
        t("notifications.automaticMerge.description"),
      );
    } else if (notification?.kind === "noChanges") {
      notifyNoChanges(
        t("notifications.noChanges.title", { entity: entityLabel }),
        t("notifications.noChanges.description", { entity: entityLabel }),
      );
    } else if (notification?.kind === "updated") {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", {
          fields: notification.fields.join(", "),
        }),
      );
    }

    return result;
  });
}

export function useSettingsResource<T extends object>({
  defaults,
  entityLabel,
  load: loader,
  save: saver,
  onLoaded,
  onMutationResult,
  beforeSave,
  buildPatch,
  autoLoad = true,
  conflict: conflictConfig,
}: UseSettingsResourceParams<T>): SettingsHookResult<T> {
  const [baseline, setBaseline] = useState<T>(defaults);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(autoLoad));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [internalConflict, setInternalConflict] = useState<SettingsConflictMachineState<T>>({ phase: "idle" });
  const conflictSequenceRef = useRef(0);
  const conflictActionPendingRef = useRef(false);
  const saveDeduplicator = useRef(
    new SettingsSaveDeduplicator<SettingsSaveResult<T>>(),
  ).current;

  const ctrlRef = useRef<AbortController | null>(null);
  const pendingLoadsRef = useRef<number>(0);

  /** Reuses identical in-flight loads and aborts stale loads for different states. */
  const inFlightLoadRef = useRef<InFlightSettingsLoad<T> | null>(null);

  const abortCurrent = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  const loaderRef = useRef(loader);
  const saverRef = useRef(saver);
  const onLoadedRef = useRef(onLoaded);
  const onMutationResultRef = useRef(onMutationResult);
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
    onMutationResultRef.current = onMutationResult;
  }, [onMutationResult]);

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

  const load = useCallback(
    async (nextState?: ContentState) => {
      const state: ContentState = nextState ?? DEFAULT_CONTENT_STATE;

      // Reuse an identical in-flight load instead of starting a duplicate request.
      const inFlight = inFlightLoadRef.current;
      if (canReuseSettingsLoad(inFlight, state)) {
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

  const performSave = useCallback(
    async (nextValues: T): Promise<SettingsSaveResult<T>> => {
      abortCurrent();

      const abortController = newAbort();
      ctrlRef.current = abortController;

      setIsSaving(true);
      let attemptedLocal = nextValues;
      const beforeSaveFn = beforeSaveRef.current;
      const buildPatchFn = buildPatchRef.current;
      const saverFn = saverRef.current;
      const onMutationResultFn = onMutationResultRef.current;

      try {
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

        const mutationResult = await logSpan(
          "ui.settingsResource.save",
          {
            state: DEFAULT_CONTENT_STATE,
            entity: entityLabelRef.current,
            fields,
          },
          () => saverFn(payload, { signal: abortController.signal }),
        );

        setBaseline(mutationResult.value);
        onMutationResultFn?.(mutationResult.value, mutationResult.outcome);

        return mutationResult.outcome === "noChanges"
          ? { status: "noChanges", value: mutationResult.value, fields } as const
          : { status: "saved", value: mutationResult.value, fields } as const;
      } catch (error: unknown) {
        const config = conflictConfigRef.current;
        const details = config ? getRevisionConflictDetails(error) : null;
        if (config && details) {
          const originalBaseline = structuredClone(baseline);
          const originalLocal = structuredClone(attemptedLocal);
          const publishInteractiveConflict = (input: Readonly<{
            baseline: T;
            local: T;
            revision: number;
            current?: SettingsConflictFreshCurrent<T>;
            freshReadError?: string;
          }>) => {
            let state = transitionSettingsConflict<T>({ phase: "idle" }, {
              type: "open",
              conflictId: settingsConflictId(
                config.scope,
                ++conflictSequenceRef.current,
                input.revision,
              ),
              baseline: structuredClone(input.baseline),
              local: structuredClone(input.local),
            });
            if (input.current) {
              state = transitionSettingsConflict(state, {
                type: "freshReadSucceeded",
                current: input.current,
              });
            } else if (input.freshReadError) {
              state = transitionSettingsConflict(state, {
                type: "freshReadFailed",
                error: input.freshReadError,
              });
            }
            setInternalConflict(state);
          };

          const automatic = await executeSettingsAutomaticRebase({
            baseline: originalBaseline,
            local: originalLocal,
            signal: abortController.signal,
            fetchCurrent: config.fetchCurrent,
            presentation: config.presentation,
            normalize: beforeSaveFn
              ? (value) => beforeSaveFn(value) as T
              : undefined,
            adoptSnapshot: config.adoptSnapshot,
            mutate: (payload, signal) => saverFn(payload, { signal }),
            commit: (value) => {
              setBaseline(value);
            },
            onMutationResult: (value, outcome) => {
              onMutationResultFn?.(value, outcome);
            },
          });

          if (automatic.status === "resolved") {
            return {
              ...automatic.result,
              notification: AUTOMATIC_MERGE_NOTIFICATION,
            };
          }
          if (automatic.status === "interactive") {
            publishInteractiveConflict({
              baseline: originalBaseline,
              local: originalLocal,
              revision: automatic.current.revision,
              current: automatic.current,
            });
            return { status: "conflict" };
          }
          if (automatic.status === "freshReadFailed") {
            publishInteractiveConflict({
              baseline: originalBaseline,
              local: originalLocal,
              revision: details.currentRevision,
              freshReadError: config.messages.freshReadFailed,
            });
            return { status: "conflict" };
          }

          const secondDetails = getRevisionConflictDetails(automatic.error);
          if (!secondDetails) {
            notify.fromError(automatic.error, UiError.unexpectedSave);
            throw automatic.error;
          }

          try {
            const latest = await config.fetchCurrent(abortController.signal);
            publishInteractiveConflict({
              baseline: automatic.current.value,
              local: automatic.plan.value,
              revision: latest.revision,
              current: latest,
            });
          } catch {
            publishInteractiveConflict({
              baseline: automatic.current.value,
              local: automatic.plan.value,
              revision: secondDetails.currentRevision,
              freshReadError: config.messages.freshReadFailed,
            });
          }
          return { status: "conflict" };
        }
        notify.fromError(error, UiError.unexpectedSave);
        throw error;
      } finally {
        setIsSaving(false);
        ctrlRef.current = null;
      }
    },
    [baseline, abortCurrent],
  );

  const save = useCallback((nextValues: T): Promise<SettingsSaveResult<T>> => {
    return saveDeduplicator.run(() => performSave(nextValues));
  }, [performSave, saveDeduplicator]);

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
      ? toSettingsConflictPresentation({ ...config.presentation, snapshot })
      : [];

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
          },
          onMutationResult: (value, outcome) =>
            onMutationResultRef.current?.(value, outcome),
        });
        if (execution.status === "error") throw execution.error;
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "complete" })
          : current);
        return CONFLICT_ACTION_SUCCESS;
      } catch (error: unknown) {
        const nextDetails = getRevisionConflictDetails(error);
        if (nextDetails) {
          try {
            const latest = await config.fetchCurrent(mutationController.signal);
            let nextState = transitionSettingsConflict<T>({ phase: "idle" }, {
              type: "open",
              conflictId: settingsConflictId(
                config.scope,
                ++conflictSequenceRef.current,
                latest.revision,
              ),
              baseline: conflictCurrent.value,
              local: plan.value,
            });
            nextState = transitionSettingsConflict(nextState, {
              type: "freshReadSucceeded",
              current: latest,
            });
            setInternalConflict((current) =>
              current.phase !== "idle" && current.conflictId === state.conflictId
                ? nextState
                : current,
            );
          } catch {
            setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
              ? transitionSettingsConflict(current, { type: "secondConflict", baseline: conflictCurrent.value, local: plan.value, error: config.messages.mutationFailed })
              : current);
          }
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

    const apply = async (
      choices: ConflictResolutionChoices,
    ): Promise<ConflictActionExecutionResult> => {
      if (!snapshot || isSettingsConflictPending(state) || conflictActionPendingRef.current) return CONFLICT_ACTION_ERROR;
      const plan = buildSettingsConflictMutationPlan({
        snapshot,
        choices,
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

    return {
      conflictId: state.conflictId,
      groups,
      pending: isSettingsConflictPending(state),
      error: state.error,
      canResolve: snapshot !== null,
      abandon: () => {
        if (isSettingsConflictPending(state)) return CONFLICT_ACTION_ERROR;
        setInternalConflict((current) => current.phase !== "idle" && current.conflictId === state.conflictId
          ? transitionSettingsConflict(current, { type: "abandon" })
          : current);
        return CONFLICT_ACTION_SUCCESS;
      },
      apply,
    };
  }, [conflictConfig, internalConflict]);

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
