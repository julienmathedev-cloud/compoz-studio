"use client";

/**
 * @file apps/studio/src/features/preview/hooks/usePreviewBridge.ts
 * @layer studio/features/preview/hooks
 *
 * @description
 * Studio-to-preview iframe bridge built on scoped `postMessage` events.
 *
 * @remarks
 * - Sends `sync`, `reset`, and `baseline` messages; preview readiness is handled by the caller.
 * - Uses `targetOrigin="*"` by default because preview iframes may be sandboxed.
 */

import { log } from "@compoz/infra/lib/log";
import { useCallback, useMemo, type RefObject } from "react";

export type PreviewScope =
  | "social"
  | "header"
  | "footer"
  | "menu"
  | "full"
  | (string & {});

/** Preview-to-Studio ready signal consumed by higher-level preview hooks. */
export type PreviewReadyMessage = Readonly<{
  type: "compoz.preview.ready";
  scope: PreviewScope;
}>;

export type PreviewSyncMessage<T> = Readonly<{
  type: "compoz.preview.sync";
  scope: PreviewScope;
  payload: T;
}>;

export type PreviewResetMessage = Readonly<{
  type: "compoz.preview.reset";
  scope: PreviewScope;
}>;

export type PreviewBaselineMessage<T> = Readonly<{
  type: "compoz.preview.baseline";
  scope: PreviewScope;
  payload: T;
}>;

export type PreviewMessage<T> =
  | PreviewReadyMessage
  | PreviewBaselineMessage<T>
  | PreviewSyncMessage<T>
  | PreviewResetMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Minimal guard used only to extract debug metadata from unknown messages. */
function isPreviewMessageLike(
  value: unknown,
): value is { type?: unknown; scope?: unknown } {
  if (!isRecord(value)) return false;
  return "type" in value || "scope" in value;
}

function getMessageMeta(message: unknown): {
  type?: unknown;
  scope?: unknown;
} {
  if (!isPreviewMessageLike(message)) return {};

  return {
    type: message["type"],
    scope: message["scope"],
  };
}

type Options = Readonly<{
  /** Target origin for postMessage; defaults to "*" for sandboxed preview iframes. */
  targetOrigin?: string;
}>;

type Bridge = Readonly<{
  sync: <T>(scope: PreviewScope, payload: T) => void;
  reset: (scope: PreviewScope) => void;
  setBaseline: <T>(scope: PreviewScope, payload: T) => void;
}>;

export function usePreviewBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  options?: Options,
): Bridge {
  const targetOrigin = options?.targetOrigin ?? "*";

  const post = useCallback(
    (message: unknown) => {
      const win = iframeRef.current?.contentWindow;
      const meta = getMessageMeta(message);

      log.debug("studio.previewBridge.post", {
        hasWin: Boolean(win),
        targetOrigin,
        messageType: meta.type,
        scope: meta.scope,
      });

      if (!win) return;
      win.postMessage(message, targetOrigin);
    },
    [iframeRef, targetOrigin],
  );

  const sync = useCallback(
    <T>(scope: PreviewScope, payload: T) => {
      const msg: PreviewSyncMessage<T> = {
        type: "compoz.preview.sync",
        scope,
        payload,
      };

      post(msg);
    },
    [post],
  );

  const reset = useCallback(
    (scope: PreviewScope) => {
      const msg: PreviewResetMessage = {
        type: "compoz.preview.reset",
        scope,
      };

      post(msg);
    },
    [post],
  );

  const setBaseline = useCallback(
    <T>(scope: PreviewScope, payload: T) => {
      const msg: PreviewBaselineMessage<T> = {
        type: "compoz.preview.baseline",
        scope,
        payload,
      };

      post(msg);
    },
    [post],
  );

  return useMemo(
    () => ({ sync, reset, setBaseline }) as const,
    [sync, reset, setBaseline],
  );
}
