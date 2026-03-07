"use client";

/**
 * @file apps/studio/src/features/preview/hooks/usePreviewBridge.ts
 * @layer hooks/studio/preview
 *
 * @description
 * Hook studio fournissant un bridge de communication entre le studio et la preview
 * via `postMessage` (iframe).
 *
 * @remarks
 * - Centralise les messages `sync`, `reset` et `baseline` par scope.
 * - Le handshake `compoz.preview.ready` est géré par un hook de plus haut niveau.
 * - La sécurité repose sur le contrat de message (`type` + `scope`)
 *   et le filtrage côté receiver.
 * - Strictement UI-only : aucune logique métier.
 */

import { log } from "@compoz/infra/lib/log";
import { useCallback, useMemo, type RefObject } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Identifiant logique du périmètre de preview.
 */
export type PreviewScope =
  | "social"
  | "header"
  | "footer"
  | "menu"
  | "full"
  | (string & {});

/**
 * Message émis par la preview pour signaler sa disponibilité.
 */
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

/* -------------------------------------------------------------------------- */
/*                               Type guards                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Guard minimal utilisé uniquement pour le logging/debug.
 */
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

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

/**
 * Options de configuration du bridge de preview.
 */
type Options = Readonly<{
  /**
   * Origin cible pour postMessage.
   * Par défaut : "*" (iframe potentiellement sandboxée).
   */
  targetOrigin?: string;
}>;

/**
 * API exposée par le hook `usePreviewBridge`.
 */
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
