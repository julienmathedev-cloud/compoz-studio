"use client";

/**
 * @file apps/studio/src/features/preview/hooks/usePreviewOverride.ts
 * @layer hooks/admin/preview
 *
 * @description
 * Hook preview (iframe) recevant et appliquant des overrides temporaires via `postMessage`.
 *
 * @remarks
 * - Centralise la logique “receiver” côté preview.
 * - Filtre les messages par `origin` et `scope`.
 * - Gère les messages `baseline`, `sync` et `reset`.
 * - Émet le handshake `compoz.preview.ready` à l’attache.
 * - Strictement UI-only : aucune logique métier.
 */

import { log } from "@compoz/infra/lib/log";
import { useCallback, useEffect, useMemo, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PreviewScope =
  | "social"
  | "header"
  | "footer"
  | "menu"
  | "full"
  | (string & {});

type PreviewReadyMessage = Readonly<{
  type: "compoz.preview.ready";
  scope: PreviewScope;
}>;

type PreviewSyncMessage<T> = Readonly<{
  type: "compoz.preview.sync";
  scope: PreviewScope;
  payload: T;
}>;

type PreviewResetMessage = Readonly<{
  type: "compoz.preview.reset";
  scope: PreviewScope;
}>;

type PreviewBaselineMessage<T> = Readonly<{
  type: "compoz.preview.baseline";
  scope: PreviewScope;
  payload: T;
}>;

type PreviewMessage<T> =
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

function hasStringProp(
  obj: Record<string, unknown>,
  key: string,
): obj is Record<string, string> {
  return typeof obj[key] === "string";
}

function isPreviewMessage<T>(value: unknown): value is PreviewMessage<T> {
  if (!isRecord(value)) return false;

  // scope
  if (!hasStringProp(value, "scope")) return false;

  // type
  if (!hasStringProp(value, "type")) return false;

  // type strict (on accepte seulement nos 4 types)
  return (
    value.type === "compoz.preview.ready" ||
    value.type === "compoz.preview.sync" ||
    value.type === "compoz.preview.reset" ||
    value.type === "compoz.preview.baseline"
  );
}

function getMessageMeta(message: unknown): { type?: unknown; scope?: unknown } {
  if (!isRecord(message)) return {};
  return { type: message["type"], scope: message["scope"] };
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

/**
 * Options de configuration du receiver de preview.
 */
type Options = {
  enabled?: boolean;

  /**
   * Origin autorisé pour les messages entrants.
   * - Si fourni : source de vérité.
   * - Sinon : déduit depuis `document.referrer`.
   */
  origin?: string;
};

/**
 * Contrat de retour du hook `usePreviewOverride`.
 */
type Result<T> = {
  baseline: T | null;
  override: T | null;
  isOverridden: boolean;
  reset: () => void;
};

export function usePreviewOverride<T>(
  scope: PreviewScope,
  options?: Options,
): Result<T> {
  const [override, setOverride] = useState<T | null>(null);
  const [baseline, setBaseline] = useState<T | null>(null);

  const enabled = options?.enabled ?? true;

  const parentOrigin = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const ref = document.referrer;
      return ref ? new URL(ref).origin : "";
    } catch {
      return "";
    }
  }, []);

  const allowedOrigin = useMemo(() => {
    if (options?.origin) return options.origin;
    return parentOrigin;
  }, [options?.origin, parentOrigin]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    log.debug("preview.listener.attach", {
      scope,
      allowedOrigin,
      parentOrigin,
      enabled,
    });

    // Handshake : notifier l’admin que la preview est prête
    try {
      const ready: PreviewReadyMessage = {
        type: "compoz.preview.ready",
        scope,
      };
      const targetOrigin = parentOrigin || "*";
      window.parent?.postMessage(ready, targetOrigin);

      log.debug("preview.ready.sent", { scope, targetOrigin, parentOrigin });
    } catch {
      // no-op
    }

    const onMessage = (event: MessageEvent) => {
      const meta = getMessageMeta(event.data);

      log.debug("preview.message.preFilter", {
        scope,
        eventOrigin: event.origin,
        allowedOrigin,
        parentOrigin,
        messageType: meta.type,
        msgScope: meta.scope,
      });

      // Origin strict si on en a un
      if (allowedOrigin && event.origin !== allowedOrigin) return;

      const data = event.data;

      if (!isPreviewMessage<T>(data)) return;
      if (data.scope !== scope) return;

      log.debug("preview.message", {
        scope,
        type: data.type,
        msgScope: data.scope,
        hasPayload: "payload" in (data as Record<string, unknown>),
      });

      if (data.type === "compoz.preview.reset") {
        setOverride(null);
        return;
      }

      if (data.type === "compoz.preview.baseline") {
        setBaseline((data as PreviewBaselineMessage<T>).payload);
        return;
      }

      if (data.type === "compoz.preview.sync") {
        setOverride((data as PreviewSyncMessage<T>).payload);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, allowedOrigin, parentOrigin, scope]);

  const reset = useCallback(() => {
    setOverride(null);
  }, []);

  return {
    baseline,
    override,
    isOverridden: override !== null,
    reset,
  };
}
