"use client";

/**
 * @file apps/studio/src/features/preview/hooks/useStudioPreview.ts
 * @layer studio/features/preview/hooks
 *
 * @description
 * Studio preview coordinator for iframe readiness, baselines, and draft overrides.
 *
 * @remarks
 * - Buffers baselines until the iframe has a contentWindow and the target scope is ready.
 * - Supports live preview for settings screens and manual sync for the builder through `liveEnabled`.
 */

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log } from "@compoz/infra/lib/log";
import { usePreviewBridge } from "@compoz/studio/features/preview/hooks/usePreviewBridge";

type UseStudioPreviewParams<T> = Readonly<{
  /** Saved baseline injected into the preview through `compoz.preview.baseline`. */
  baseline: T | null;

  /** Enables automatic draft sync; disabled callers control sync/reset manually. */
  liveEnabled?: boolean;
}>;

export type UseStudioPreviewResult<T> = Readonly<{
  iframeRef: RefObject<HTMLIFrameElement | null>;

  /** Current draft; live mode pushes it automatically, manual mode waits for `onSync()`. */
  draft: T | null;
  setDraft: (draft: T | null) => void;

  /** Queues and flushes a baseline once the iframe window and target scope are ready. */
  setBaseline: <U>(scope: string, payload: U) => void;

  /** Scopes that sent `compoz.preview.ready` for this iframe. */
  ready: Readonly<{
    isReady: (scope: string) => boolean;
    scopes: readonly string[];
  }>;

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

/** Guards ready messages emitted by the preview iframe. */
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

export function useStudioPreview<T>(
  scope: string,
  { baseline, liveEnabled = true }: UseStudioPreviewParams<T>,
): UseStudioPreviewResult<T> {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = usePreviewBridge(iframeRef);

  const [draft, setDraft] = useState<T | null>(null);

  /** Mutable ready scopes for the current iframe instance. */
  const readyScopesRef = useRef<Set<string>>(new Set());

  const [readyScopes, setReadyScopes] = useState<readonly string[]>([]);
  const [readySet, setReadySet] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  /** Baseline buffer keyed by scope until the iframe and scope are ready. */
  const pendingBaselinesRef = useRef<Map<string, unknown>>(new Map());

  const hasContentWindow = useCallback(() => {
    return Boolean(iframeRef.current?.contentWindow);
  }, []);

  const commitReadySnapshot = useCallback(() => {
    const nextScopes = Array.from(readyScopesRef.current.values());
    setReadyScopes(nextScopes);
    setReadySet(new Set(nextScopes));
  }, []);

  /** Flushes a pending baseline only after both iframe window and scope readiness are available. */
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

      /** When the main scope becomes ready, immediately replay its baseline and live draft if present. */
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

  /** Keeps the main scope baseline as the saved preview state; live overrides layer on top through `sync`. */
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

  /** Live mode pushes drafts automatically and resets to baseline when the draft is cleared. */
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

  /** Manual sync path used by builder screens when live mode is disabled. */
  const onSync = useCallback(() => {
    log.debug("studio.preview.onSync", {
      scope,
      hasDraft: draft != null,
      liveEnabled,
    });

    if (draft == null) return;
    preview.sync(scope, draft);
  }, [draft, liveEnabled, preview, scope]);

  const onReset = useCallback(() => {
    log.debug("studio.preview.onReset", {
      scope,
      liveEnabled,
    });

    preview.reset(scope);
  }, [liveEnabled, preview, scope]);

  /** Public baseline setter for primary and secondary preview scopes. */
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
