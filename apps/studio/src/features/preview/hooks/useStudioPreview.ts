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
 * - Orchestre le draft UI live, ainsi que les actions Sync / Reset.
 * - Strictement UI-only : aucune logique métier.
 */

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log } from "@compoz/infra/lib/log";
import { usePreviewBridge } from "@compoz/studio/features/preview/hooks/usePreviewBridge";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Contrat de retour du hook `useStudioPreview`.
 */
export type UseStudioPreviewResult<T> = Readonly<{
  iframeRef: RefObject<HTMLIFrameElement | null>;

  /** Draft courant (valeurs RHF live). */
  draft: T | null;
  setDraft: (draft: T | null) => void;

  /**
   * Injecte une baseline dans la preview pour un scope donné.
   *
   * @remarks
   * Robuste : buffer + flush automatique quand (iframeWindow OK + scope ready).
   */
  setBaseline: <U>(scope: string, payload: U) => void;

  /** Scopes ayant envoyé `compoz.preview.ready` pour CETTE iframe. */
  ready: Readonly<{
    isReady: (scope: string) => boolean;
    scopes: readonly string[];
  }>;

  /** Helpers `PreviewFrame`. */
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
  baseline: T | null,
): UseStudioPreviewResult<T> {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = usePreviewBridge(iframeRef);

  const [draft, setDraft] = useState<T | null>(null);

  // Scopes ready pour CETTE iframe (source mutable pour la logique)
  const readyScopesRef = useRef<Set<string>>(new Set());

  // Snapshot render-safe (évite de lire `ref.current` pendant le render)
  const [readyScopes, setReadyScopes] = useState<readonly string[]>([]);
  const [readySet, setReadySet] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // Buffer des baselines à envoyer (scope -> payload)
  const pendingBaselinesRef = useRef<Map<string, unknown>>(new Map());

  const hasContentWindow = useCallback(() => {
    return Boolean(iframeRef.current?.contentWindow);
  }, []);

  /**
   * Commit d’un snapshot render-safe (liste + set) à partir de la ref.
   *
   * @remarks
   * Appelé uniquement hors render (handlers / effects).
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
    });

    if (baseline != null) {
      setDraft(baseline);
    }

    for (const readyScope of readyScopesRef.current.values()) {
      flushBaselineIfPossible(readyScope);
    }
  }, [baseline, flushBaselineIfPossible, scope]);

  /* ---------------------------------------------------------------------- */
  /*                           preview handshake                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const win = iframeRef.current?.contentWindow;
      if (win && event.source !== win) return;

      if (!isPreviewReadyMessage(event.data)) return;

      const readyScope = event.data.scope;
      log.debug("studio.preview.ready", { scope: readyScope });

      markReady(readyScope);

      if (readyScope === scope && baseline != null) {
        pendingBaselinesRef.current.set(scope, baseline);
        flushBaselineIfPossible(scope);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [baseline, flushBaselineIfPossible, markReady, scope]);

  /* ---------------------------------------------------------------------- */
  /*                                actions                                 */
  /* ---------------------------------------------------------------------- */

  const onSync = useCallback(() => {
    log.debug("studio.preview.onSync", { scope, hasDraft: draft != null });

    if (draft == null) return;
    preview.sync(scope, draft);
  }, [draft, preview, scope]);

  const onReset = useCallback(() => {
    log.debug("studio.preview.onReset", { scope });
    preview.reset(scope);
  }, [preview, scope]);

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
