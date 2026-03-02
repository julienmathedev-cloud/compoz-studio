"use client";

/**
 * @file apps/studio/src/features/settings/hooks/useSettingsResource.ts
 * @layer hooks/shared
 * @description
 * Hook générique RHF-first pour la gestion des Settings (GET/PATCH avec baseline).
 *
 * @remarks
 * - La source de vérité est RHF.
 * - Gère uniquement l’I/O, la baseline et le calcul de patch minimal.
 * - Les messages UI (toasts) doivent être gérés par l’appelant.
 * - Écriture: toujours sur "draft" (draft-only). La lecture peut cibler "draft" ou "published".
 */

import {
  WRITE_CONTENT_STATE,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Contrat minimal pour une fonction de traduction.
 * @remarks
 * - Compatible next-intl: `const t = useTranslations("admin")`
 * - Doit accepter (key, values?) et retourner une string.
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
   * - Calcule un patch minimal depuis baseline → nextValues (si buildPatch fourni)
   * - Ne fait aucun appel réseau si patch vide (status = "noChanges")
   * - Met à jour la baseline avec la réponse API (status = "saved")
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
 * - Pas de hook ici (aucun `useTranslations` inside) : `t` est injecté par l'appelant.
 * - Clés utilisées (scan i18n-friendly) :
 *   - notifications.noChanges.title / description
 *   - notifications.saved.title / description (ou override description)
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
    const res = await save(nextValues);

    if (res.status === "noChanges") {
      notifyNoChanges(
        t("notifications.noChanges.title", { entity: entityLabel }),
        t("notifications.noChanges.description", { entity: entityLabel }),
      );
      return res;
    }

    notifyUpdated(
      t("notifications.updated.title", { entity: entityLabel }),
      t("notifications.updated.description", { fields: res.fields.join(", ") }),
    );

    return res;
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

  // Dédoublonnage : si un load(state) identique est déjà en vol, on réutilise la promise.
  const inFlightLoadRef = useRef<{
    state: ContentState;
    promise: Promise<T>;
    ctrl: AbortController;
  } | null>(null);

  const abortCurrent = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  // Refs pour éviter de recréer des handlers
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
      const s: ContentState = nextState ?? WRITE_CONTENT_STATE;

      // 1) Si un load identique est déjà en cours → on réutilise.
      const inFlight = inFlightLoadRef.current;
      if (inFlight && inFlight.state === s) {
        return inFlight.promise;
      }

      // 2) Sinon, on abort l'ancien load (si différent) et on en démarre un nouveau.
      abortCurrent();

      const ac = newAbort();
      ctrlRef.current = ac;

      pendingLoadsRef.current += 1;
      if (!hasLoadedOnceRef.current) setIsLoading(true);

      const promise = (async () => {
        try {
          const data = await logSpan(
            "ui.settingsResource.load",
            { state: s, entity: entityLabelRef.current },
            () => loaderRef.current(s, { signal: ac.signal }),
          );

          const normalized = (onLoadedRef.current?.(data) ?? data) as T;
          setBaseline(normalized);

          if (!hasLoadedOnceRef.current) {
            hasLoadedOnceRef.current = true;
            setIsLoading(false);
          }

          return normalized;
        } catch (e: unknown) {
          if (!isAbortError(e)) {
            notify.fromError(e);
            if (!hasLoadedOnceRef.current) {
              hasLoadedOnceRef.current = true;
              setIsLoading(false);
            }
          }
          throw e;
        } finally {
          pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);
          if (pendingLoadsRef.current === 0) {
            setIsLoading(false);
          }

          // cleanup refs
          if (ctrlRef.current === ac) ctrlRef.current = null;
          if (inFlightLoadRef.current?.ctrl === ac) {
            inFlightLoadRef.current = null;
          }
        }
      })();

      inFlightLoadRef.current = { state: s, promise, ctrl: ac };
      return promise;
    },
    [abortCurrent],
  );

  const save = useCallback(
    async (nextValues: T): Promise<SettingsSaveResult<T>> => {
      abortCurrent();
      const ac = newAbort();
      ctrlRef.current = ac;

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

        // Si patch minimal vide → pas d’appel réseau
        if (buildPatchFn && fields.length === 0) {
          return { status: "noChanges", fields: [] } as const;
        }

        const saved = await logSpan(
          "ui.settingsResource.save",
          {
            state: WRITE_CONTENT_STATE,
            entity: entityLabelRef.current,
            fields,
          },
          () => saverFn(payload, { signal: ac.signal }),
        );

        setBaseline(saved);
        onSavedFn?.(saved);

        return { status: "saved", value: saved, fields } as const;
      } catch (e: unknown) {
        notify.fromError(e, UiError.unexpectedSave);
        throw e;
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
