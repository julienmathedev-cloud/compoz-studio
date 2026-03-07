"use client";

/**
 * @file apps/studio/src/features/settings/hooks/useSettingsResource.ts
 * @layer hooks/studio/settings
 * @description
 * Hook générique RHF-first pour la gestion des Settings (GET/PATCH avec baseline).
 *
 * @remarks
 * - La source de vérité est RHF.
 * - Gère uniquement l’I/O, la baseline et le calcul de patch minimal.
 * - Les messages UI (toasts) doivent être gérés par l’appelant.
 * - Écriture : toujours sur "draft" (draft-only). La lecture peut cibler "draft" ou "published".
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

/**
 * Contrat minimal pour une fonction de traduction.
 *
 * @remarks
 * - Compatible next-intl : `const t = useTranslations("studio")`
 * - Doit accepter `(key, values?)` et retourner une string.
 */
export type TFunc = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/**
 * Résultat de `save()` :
 * - `noChanges` : patch minimal vide → aucun appel réseau
 * - `saved` : sauvegarde effectuée, retourne la valeur persistée
 */
export type SettingsSaveResult<T> =
  | Readonly<{ status: "noChanges"; fields: ReadonlyArray<string> }>
  | Readonly<{ status: "saved"; value: T; fields: ReadonlyArray<string> }>;

/**
 * Contrat de retour exposé par `useSettingsResource`.
 */
export type SettingsHookResult<T> = Readonly<{
  /** Baseline actuelle (valeur chargée / dernier save). */
  baseline: T;
  isLoading: boolean;
  isSaving: boolean;

  /** Recharge la baseline depuis l’API. */
  load: (state?: ContentState) => Promise<T>;

  /**
   * Sauvegarde depuis des valeurs RHF.
   * - Calcule un patch minimal depuis baseline → nextValues (si `buildPatch` fourni)
   * - Ne fait aucun appel réseau si patch vide (`status = "noChanges"`)
   * - Met à jour la baseline avec la réponse API (`status = "saved"`)
   */
  save: (nextValues: T) => Promise<SettingsSaveResult<T>>;
}>;

type UseSettingsResourceParams<T> = Readonly<{
  defaults: T;
  entityLabel: string;
  load: (state: ContentState, opts?: HttpOpts) => Promise<T>;
  save: (next: Partial<T> | T, opts?: HttpOpts) => Promise<T>;
  onLoaded?: (value: T) => T | void;
  onSaved?: (value: T) => void;
  beforeSave?: (value: T) => Partial<T> | T;
  buildPatch?: (baseline: T, next: T) => Partial<T> | null;
  autoLoad?: boolean;
}>;

/* -------------------------------------------------------------------------- */
/*                               Toast wrapper                                 */
/* -------------------------------------------------------------------------- */

/**
 * Wrappe un `save()` de Settings pour afficher les toasts standard.
 *
 * @remarks
 * - Pas de hook ici (aucun `useTranslations` inside) : `t` est injecté par l’appelant.
 * - Clés utilisées (scan i18n-friendly) :
 *   - `notifications.noChanges.title` / `notifications.noChanges.description`
 *   - `notifications.updated.title` / `notifications.updated.description`
 */
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
}: UseSettingsResourceParams<T>): SettingsHookResult<T> {
  const [baseline, setBaseline] = useState<T>(defaults);
  const [isLoading, setIsLoading] = useState<boolean>(!!autoLoad);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const ctrlRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef<boolean>(false);
  const pendingLoadsRef = useRef<number>(0);

  /**
   * Dédoublonnage :
   * - si un `load(state)` identique est déjà en vol, on réutilise sa promise
   * - sinon, on annule l’ancien load et on démarre un nouveau cycle
   */
  const inFlightLoadRef = useRef<{
    state: ContentState;
    promise: Promise<T>;
    ctrl: AbortController;
  } | null>(null);

  const abortCurrent = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Refs stables pour éviter de recréer les handlers                         */
  /* ------------------------------------------------------------------------ */

  const loaderRef = useRef(loader);
  const saverRef = useRef(saver);
  const onLoadedRef = useRef(onLoaded);
  const onSavedRef = useRef(onSaved);
  const beforeSaveRef = useRef(beforeSave);
  const buildPatchRef = useRef(buildPatch);
  const entityLabelRef = useRef(entityLabel);

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

  const load = useCallback(
    async (nextState?: ContentState) => {
      const state: ContentState = nextState ?? DEFAULT_CONTENT_STATE;

      // 1) Si un load identique est déjà en cours → on réutilise.
      const inFlight = inFlightLoadRef.current;
      if (inFlight && inFlight.state === state) {
        return inFlight.promise;
      }

      // 2) Sinon, on abort l'ancien load (si différent) et on en démarre un nouveau.
      abortCurrent();

      const abortController = newAbort();
      ctrlRef.current = abortController;

      pendingLoadsRef.current += 1;
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      }

      const promise = (async () => {
        try {
          const data = await logSpan(
            "ui.settingsResource.load",
            { state, entity: entityLabelRef.current },
            () => loaderRef.current(state, { signal: abortController.signal }),
          );

          const normalized = (onLoadedRef.current?.(data) ?? data) as T;
          setBaseline(normalized);

          if (!hasLoadedOnceRef.current) {
            hasLoadedOnceRef.current = true;
            setIsLoading(false);
          }

          return normalized;
        } catch (error: unknown) {
          if (!isAbortError(error)) {
            notify.fromError(error);

            if (!hasLoadedOnceRef.current) {
              hasLoadedOnceRef.current = true;
              setIsLoading(false);
            }
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

      try {
        const beforeSaveFn = beforeSaveRef.current;
        const buildPatchFn = buildPatchRef.current;
        const saverFn = saverRef.current;
        const onSavedFn = onSavedRef.current;

        const candidate = (
          beforeSaveFn ? beforeSaveFn(nextValues) : nextValues
        ) as T;

        const payload: Partial<T> | T =
          buildPatchFn?.(baseline, candidate) ?? candidate;

        const fields = buildPatchFn
          ? Object.keys(payload as Record<string, unknown>)
          : Object.keys(candidate as Record<string, unknown>);

        // Si patch minimal vide → pas d’appel réseau.
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
        notify.fromError(error, UiError.unexpectedSave);
        throw error;
      } finally {
        setIsSaving(false);
        ctrlRef.current = null;
      }
    },
    [baseline, abortCurrent],
  );

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
        load,
        save,
      }) as const,
    [baseline, isLoading, isSaving, load, save],
  );
}
