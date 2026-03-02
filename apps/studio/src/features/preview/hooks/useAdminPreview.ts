"use client";

/**
 * @file apps/studio/src/features/preview/hooks/usePreview.ts
 * @layer hooks/admin/preview
 *
 * @description
 * Hook admin encapsulant le wiring standard de la preview (iframe + bridge + draft).
 *
 * @remarks
 * - Gère le handshake `compoz.preview.ready` par scope.
 * - Sécurise l’injection des baselines via un buffer + flush fiable.
 * - Orchestre le draft UI live, ainsi que les actions Sync / Reset.
 * - Strictement UI-only : aucune logique métier.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log } from "@compoz/infra/lib/log";
import { usePreviewBridge } from "@compoz/studio/features/preview/hooks/usePreviewBridge";
import type { RefObject } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Contrat de retour du hook `useAdminPreview`.
 */
export type UseAdminPreviewResult<T> = Readonly<{
  iframeRef: RefObject<HTMLIFrameElement | null>;

  /** Draft courant (valeurs RHF live) */
  draft: T | null;
  setDraft: (draft: T | null) => void;

  /**
   * Injecte une baseline dans le preview pour un scope donné.
   * @remarks
   * Robuste : buffer + flush automatique quand (iframeWindow OK + scope ready).
   */
  setBaseline: <U>(scope: string, payload: U) => void;

  /** Scopes ayant envoyé `compoz.preview.ready` pour CETTE iframe. */
  ready: Readonly<{
    isReady: (scope: string) => boolean;
    scopes: readonly string[];
  }>;

  /** Helpers PreviewFrame */
  frame: Readonly<{
    onLoad: () => void;
    onSync: () => void;
    onReset: () => void;
    syncDisabled: boolean;
  }>;
}>;

type PreviewReadyMessage = {
  type: "compoz.preview.ready";
  scope: string;
};

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

export function useAdminPreview<T>(
  scope: string,
  baseline: T | null,
): UseAdminPreviewResult<T> {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = usePreviewBridge(iframeRef);

  const [draft, setDraft] = useState<T | null>(null);

  // Scopes ready pour CETTE iframe (source mutable pour la logique)
  const readyScopesRef = useRef<Set<string>>(new Set());

  // ✅ Snapshot pour le rendu (évite de lire `ref.current` pendant le render)
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
   * Commit d’un snapshot “render-safe” (liste + set) à partir de la ref.
   * Important : appelé uniquement en dehors du render (handlers / effects).
   */
  const commitReadySnapshot = useCallback(() => {
    const nextScopes = Array.from(readyScopesRef.current.values());
    setReadyScopes(nextScopes);
    setReadySet(new Set(nextScopes));
  }, []);

  /**
   * Essaie d’envoyer la baseline si (iframeWindow OK + scope ready + payload pending)
   */
  const flushBaselineIfPossible = useCallback(
    (s: string) => {
      if (!hasContentWindow()) return;
      if (!readyScopesRef.current.has(s)) return;
      if (!pendingBaselinesRef.current.has(s)) return;

      const payload = pendingBaselinesRef.current.get(s);
      pendingBaselinesRef.current.delete(s);

      log.debug("admin.preview.flushBaseline", {
        scope: s,
        hasContentWindow: true,
      });

      preview.setBaseline(s, payload);
    },
    [hasContentWindow, preview],
  );

  /**
   * Marque un scope comme ready + flush immédiat si quelque chose attend.
   */
  const markReady = useCallback(
    (s: string) => {
      const before = readyScopesRef.current.size;
      readyScopesRef.current.add(s);

      // ✅ Snapshot uniquement si changement réel
      if (readyScopesRef.current.size !== before) {
        commitReadySnapshot();
      }

      flushBaselineIfPossible(s);
    },
    [commitReadySnapshot, flushBaselineIfPossible],
  );

  /* ---------------------------------------------------------------------- */
  /*                              iframe load                               */
  /* ---------------------------------------------------------------------- */

  const onLoad = useCallback(() => {
    log.debug("admin.preview.frame.load", {
      scope,
      hasIframe: Boolean(iframeRef.current),
      hasContentWindow: Boolean(iframeRef.current?.contentWindow),
    });

    // UX : Sync activable immédiatement (si cette section utilise Sync)
    if (baseline != null) setDraft(baseline);

    // Flush tous les scopes déjà ready
    for (const s of readyScopesRef.current.values()) {
      flushBaselineIfPossible(s);
    }
  }, [baseline, flushBaselineIfPossible, scope]);

  /* ---------------------------------------------------------------------- */
  /*                           preview handshake                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Sécurité : si on connaît notre contentWindow, on filtre
      const win = iframeRef.current?.contentWindow;
      if (win && event.source !== win) return;

      if (!isPreviewReadyMessage(event.data)) return;

      const readyScope = event.data.scope;
      log.debug("admin.preview.ready", { scope: readyScope });

      markReady(readyScope);

      // Bonus : si la preview a un scope principal identique, on bootstrap aussi
      if (readyScope === scope && baseline != null) {
        pendingBaselinesRef.current.set(scope, baseline);
        flushBaselineIfPossible(scope);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [baseline, flushBaselineIfPossible, markReady, scope]);

  /* ---------------------------------------------------------------------- */
  /*                              actions                                   */
  /* ---------------------------------------------------------------------- */

  const onSync = useCallback(() => {
    log.debug("onSync", { draft, scope });
    if (draft == null) return;
    preview.sync(scope, draft);
  }, [draft, preview, scope]);

  const onReset = useCallback(() => {
    log.debug("onReset", { scope });
    preview.reset(scope);
  }, [preview, scope]);

  /**
   * API publique : reliable setBaseline(scope)
   */
  const setBaseline = useCallback(
    <U>(s: string, payload: U) => {
      pendingBaselinesRef.current.set(s, payload);

      log.debug("admin.preview.setBaseline.request", {
        scope: s,
        hasContentWindow: hasContentWindow(),
        isReady: readyScopesRef.current.has(s),
      });

      flushBaselineIfPossible(s);
    },
    [flushBaselineIfPossible, hasContentWindow],
  );

  // ✅ Rendu basé sur snapshot (state), pas sur la ref
  const ready = useMemo(() => {
    return {
      scopes: readyScopes,
      isReady: (s: string) => readySet.has(s),
    } as const;
  }, [readyScopes, readySet]);

  const frame = useMemo(
    () => ({
      onLoad,
      onSync,
      onReset,
      syncDisabled: draft == null,
    }),
    [draft, onLoad, onReset, onSync],
  );

  return { iframeRef, draft, setDraft, setBaseline, ready, frame } as const;
}
