"use client";

/**
 * @file apps/studio/src/features/preview/hooks/useStudioPreview.ts
 * @layer hooks/studio/preview
 *
 * @description
 * Hook studio encapsulant le wiring standard de la preview (iframe + bridge + draft).
 *
 * @remarks
 * - Gère le handshake `compoz.preview.ready` par scope.
 * - Sécurise l’injection des baselines via un buffer + flush fiable.
 * - Supporte explicitement 2 modes :
 *   - `liveEnabled = true`  → preview live (settings sections)
 *   - `liveEnabled = false` → preview manuelle (builder)
 * - Le hook ne mélange plus 2 systèmes implicites.
 * - Strictement UI-only : aucune logique métier.
 */

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log } from "@compoz/infra/lib/log";
import { usePreviewBridge } from "@compoz/studio/features/preview/hooks/usePreviewBridge";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type UseStudioPreviewParams<T> = Readonly<{
  /**
   * Baseline persistée du scope.
   *
   * @remarks
   * - Sert de source de vérité enregistrée.
   * - Est injectée dans la preview via `compoz.preview.baseline`.
   */
  baseline: T | null;

  /**
   * Active ou non la synchronisation live du draft vers la preview.
   *
   * @remarks
   * - `true`  : les changements de draft sont poussés automatiquement
   *             via `compoz.preview.sync`.
   * - `false` : aucune synchro live automatique ; l’appelant pilote
   *             explicitement `frame.onSync()` / `frame.onReset()`.
   */
  liveEnabled?: boolean;
}>;

/**
 * Contrat de retour du hook `useStudioPreview`.
 */
export type UseStudioPreviewResult<T> = Readonly<{
  iframeRef: RefObject<HTMLIFrameElement | null>;

  /**
   * Draft courant (valeurs UI live).
   *
   * @remarks
   * - En mode live, il est poussé automatiquement dans la preview.
   * - En mode manuel, il reste local tant qu’on n’appelle pas `onSync()`.
   */
  draft: T | null;
  setDraft: (draft: T | null) => void;

  /**
   * Injecte une baseline dans la preview pour un scope donné.
   *
   * @remarks
   * - Robuste : buffer + flush automatique quand (iframeWindow OK + scope ready).
   * - Utilisable pour le scope principal ou des scopes secondaires.
   */
  setBaseline: <U>(scope: string, payload: U) => void;

  /** Scopes ayant envoyé `compoz.preview.ready` pour CETTE iframe. */
  ready: Readonly<{
    isReady: (scope: string) => boolean;
    scopes: readonly string[];
  }>;

  /** Helpers standard consommés par les écrans Studio. */
  frame: Readonly<{
    onLoad: () => void;
    onSync: () => void;
    onReset: () => void;
    syncDisabled: boolean;
  }>;
}>;

type PreviewReadyMessage = Readonly<{
  type: "compoz.preview.ready";
  scope: string;
}>;

/**
 * Type guard pour les messages `compoz.preview.ready` émis par la preview.
 */
function isPreviewReadyMessage(value: unknown): value is PreviewReadyMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value) || !("scope" in value)) {
    return false;
  }

  return (
    value.type === "compoz.preview.ready" && typeof value.scope === "string"
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export function useStudioPreview<T>(
  scope: string,
  { baseline, liveEnabled = true }: UseStudioPreviewParams<T>,
): UseStudioPreviewResult<T> {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = usePreviewBridge(iframeRef);

  const [draft, setDraft] = useState<T | null>(null);

  /**
   * Scopes ready pour CETTE iframe (source mutable côté logique).
   */
  const readyScopesRef = useRef<Set<string>>(new Set());

  /**
   * Snapshot render-safe.
   */
  const [readyScopes, setReadyScopes] = useState<readonly string[]>([]);
  const [readySet, setReadySet] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  /**
   * Buffer des baselines à envoyer (scope -> payload).
   */
  const pendingBaselinesRef = useRef<Map<string, unknown>>(new Map());

  const hasContentWindow = useCallback(() => {
    return Boolean(iframeRef.current?.contentWindow);
  }, []);

  /**
   * Commit d’un snapshot render-safe (liste + set) à partir de la ref.
   */
  const commitReadySnapshot = useCallback(() => {
    const nextScopes = Array.from(readyScopesRef.current.values());
    setReadyScopes(nextScopes);
    setReadySet(new Set(nextScopes));
  }, []);

  /**
   * Essaie d’envoyer la baseline si (iframeWindow OK + scope ready + payload pending).
   */
  const flushBaselineIfPossible = useCallback(
    (nextScope: string) => {
      if (!hasContentWindow()) return;
      if (!readyScopesRef.current.has(nextScope)) return;
      if (!pendingBaselinesRef.current.has(nextScope)) return;

      const payload = pendingBaselinesRef.current.get(nextScope);
      pendingBaselinesRef.current.delete(nextScope);

      log.debug("studio.preview.flushBaseline", {
        scope: nextScope,
        hasContentWindow: true,
      });

      preview.setBaseline(nextScope, payload);
    },
    [hasContentWindow, preview],
  );

  /**
   * Marque un scope comme ready + flush immédiat si quelque chose attend.
   */
  const markReady = useCallback(
    (nextScope: string) => {
      const before = readyScopesRef.current.size;
      readyScopesRef.current.add(nextScope);

      if (readyScopesRef.current.size !== before) {
        commitReadySnapshot();
      }

      flushBaselineIfPossible(nextScope);
    },
    [commitReadySnapshot, flushBaselineIfPossible],
  );

  /* ---------------------------------------------------------------------- */
  /*                              iframe load                               */
  /* ---------------------------------------------------------------------- */

  const onLoad = useCallback(() => {
    log.debug("studio.preview.frame.load", {
      scope,
      hasIframe: Boolean(iframeRef.current),
      hasContentWindow: Boolean(iframeRef.current?.contentWindow),
      liveEnabled,
    });

    for (const readyScope of readyScopesRef.current.values()) {
      flushBaselineIfPossible(readyScope);
    }
  }, [flushBaselineIfPossible, liveEnabled, scope]);

  /* ---------------------------------------------------------------------- */
  /*                           preview handshake                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const win = iframeRef.current?.contentWindow;
      if (win && event.source !== win) return;

      if (!isPreviewReadyMessage(event.data)) return;

      const readyScope = event.data.scope;

      log.debug("studio.preview.ready", {
        scope: readyScope,
        liveEnabled,
      });

      markReady(readyScope);

      /**
       * Quand le scope principal devient ready :
       * - on pousse sa baseline si on l’a
       * - si le mode live est actif et qu’un draft existe déjà, on pousse
       *   aussi immédiatement l’override live
       */
      if (readyScope === scope) {
        if (baseline != null) {
          pendingBaselinesRef.current.set(scope, baseline);
          flushBaselineIfPossible(scope);
        }

        if (liveEnabled && draft != null) {
          preview.sync(scope, draft);
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    baseline,
    draft,
    flushBaselineIfPossible,
    liveEnabled,
    markReady,
    preview,
    scope,
  ]);

  /* ---------------------------------------------------------------------- */
  /*                         baseline principale scope                       */
  /* ---------------------------------------------------------------------- */

  /**
   * La baseline du scope principal est toujours poussée comme baseline persistée.
   *
   * @remarks
   * - Cela garde un état "saved" cohérent côté preview.
   * - Les overrides live éventuels viennent par-dessus via `sync`.
   */
  useEffect(() => {
    if (baseline == null) return;

    pendingBaselinesRef.current.set(scope, baseline);

    log.debug("studio.preview.setBaseline.main", {
      scope,
      hasContentWindow: hasContentWindow(),
      isReady: readyScopesRef.current.has(scope),
    });

    flushBaselineIfPossible(scope);
  }, [baseline, flushBaselineIfPossible, hasContentWindow, scope]);

  /* ---------------------------------------------------------------------- */
  /*                           live sync principal                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Mode live :
   * - draft != null → push override live
   * - draft == null → reset override pour retomber sur la baseline
   *
   * @remarks
   * - Aucun push automatique si `liveEnabled = false`.
   * - C’est précisément ce qui permet de garder le builder en manuel.
   */
  useEffect(() => {
    if (!liveEnabled) return;
    if (!readyScopesRef.current.has(scope)) return;
    if (!hasContentWindow()) return;

    if (draft == null) {
      log.debug("studio.preview.live.reset", { scope });
      preview.reset(scope);
      return;
    }

    log.debug("studio.preview.live.sync", {
      scope,
      hasDraft: true,
    });

    preview.sync(scope, draft);
  }, [draft, hasContentWindow, liveEnabled, preview, scope]);

  /* ---------------------------------------------------------------------- */
  /*                                actions                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Sync manuel :
   * utile surtout quand `liveEnabled = false` (builder).
   */
  const onSync = useCallback(() => {
    log.debug("studio.preview.onSync", {
      scope,
      hasDraft: draft != null,
      liveEnabled,
    });

    if (draft == null) return;
    preview.sync(scope, draft);
  }, [draft, liveEnabled, preview, scope]);

  /**
   * Reset manuel :
   * supprime l’override courant pour retomber sur la baseline.
   */
  const onReset = useCallback(() => {
    log.debug("studio.preview.onReset", {
      scope,
      liveEnabled,
    });

    preview.reset(scope);
  }, [liveEnabled, preview, scope]);

  /**
   * API publique : `setBaseline(scope)` fiable.
   */
  const setBaseline = useCallback(
    <U>(nextScope: string, payload: U) => {
      pendingBaselinesRef.current.set(nextScope, payload);

      log.debug("studio.preview.setBaseline.request", {
        scope: nextScope,
        hasContentWindow: hasContentWindow(),
        isReady: readyScopesRef.current.has(nextScope),
      });

      flushBaselineIfPossible(nextScope);
    },
    [flushBaselineIfPossible, hasContentWindow],
  );

  const ready = useMemo(
    () =>
      ({
        scopes: readyScopes,
        isReady: (nextScope: string) => readySet.has(nextScope),
      }) as const,
    [readyScopes, readySet],
  );

  const frame = useMemo(
    () =>
      ({
        onLoad,
        onSync,
        onReset,
        syncDisabled: draft == null,
      }) as const,
    [draft, onLoad, onReset, onSync],
  );

  return { iframeRef, draft, setDraft, setBaseline, ready, frame } as const;
}
