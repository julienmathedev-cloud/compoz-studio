"use client";

/**
 * @file apps/studio/src/lib/ui/notify.ts
 * @layer studio/lib/ui
 *
 * @description
 * Sonner notification facade for the Studio UI.
 *
 * @remarks
 * - UI error tokens resolve through `uiErrors.<token>`.
 * - Domain error codes resolve through `errors.<CODE>`.
 * - A global resolver can be configured once through `notify.configure`.
 */

import { isAbortError } from "@compoz/infra/http/abort-error";
import { isHttpError } from "@compoz/infra/lib/api-fetch";
import {
  isTokenLike,
  resolveMessage,
  type ResolveKey,
} from "@compoz/studio/lib/ui/resolve-ui-message";
import type { UiErrorToken } from "@compoz/studio/lib/ui/uiError";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { toast as sonner, type ExternalToast } from "sonner";

const DEFAULTS = { duration: 3500 } as const;

/** Global optional i18n resolver configured by the Studio provider. */
let globalResolve: ResolveKey | undefined;

function withDefaults(opts?: ExternalToast): ExternalToast {
  return { ...DEFAULTS, ...(opts ?? {}) };
}

function resolveUiMessage(input: string, resolve?: ResolveKey): string {
  const r = resolve ?? globalResolve;
  if (!r) return input;

  if (isTokenLike(input)) {
    const out = resolveMessage(input, r);
    // `resolveMessage` returns the original input when the key cannot be translated.
    if (out !== input) return out;

    // Keep a stable UI fallback when a token cannot be resolved.
    const fallbackKey = "uiErrors." + UiError.errorGeneric;
    const g = r(fallbackKey);
    return g && g !== fallbackKey ? g : input;
  }

  // Plain human-readable messages are returned as-is.
  return input;
}

function pickMessage(error: unknown, fallback: string): string {
  if (typeof error === "string") {
    const s = error.trim();
    return s.length > 0 ? s : fallback;
  }
  if (error instanceof Error) {
    const s = (error.message ?? "").trim();
    return s.length > 0 ? s : fallback;
  }
  return fallback;
}

function statusToTitleToken(status: number): UiErrorToken {
  switch (status) {
    case 400:
      return UiError.http400Title;
    case 401:
      return UiError.http401Title;
    case 403:
      return UiError.http403Title;
    case 404:
      return UiError.http404Title;
    case 405:
      return UiError.http405Title;
    case 409:
      return UiError.http409Title;
    case 422:
      return UiError.http422Title;
    default:
      return status >= 500 ? UiError.serverError : UiError.errorGeneric;
  }
}

/** Maps HTTP status codes to stable description tokens when the API message is missing or generic. */
function statusToDescToken(status: number): UiErrorToken {
  switch (status) {
    case 400:
      return UiError.http400;
    case 401:
      return UiError.http401;
    case 403:
      return UiError.http403;
    case 404:
      return UiError.http404;
    case 405:
      return UiError.http405;
    case 409:
      return UiError.http409;
    case 422:
      return UiError.http422;
    default:
      return status >= 500 ? UiError.http500 : UiError.errorGeneric;
  }
}

type NotifyFromErrorLabels = Readonly<{
  abortTitle?: string;
  abortDescription?: string;
  errorTitle?: string;
}>;

export const notify = {
  /** Configures the global i18n resolver once on the client. */
  configure: (opts: { resolve?: ResolveKey }) => {
    globalResolve = opts.resolve;
  },

  success: (title: string, description?: string, opts?: ExternalToast) =>
    sonner.success(title, { description, ...withDefaults(opts) }),

  info: (title: string, description?: string, opts?: ExternalToast) =>
    sonner.info(title, { description, ...withDefaults(opts) }),

  warning: (title: string, description?: string, opts?: ExternalToast) =>
    sonner.warning(title, { description, ...withDefaults(opts) }),

  error: (title: string, description?: string, opts?: ExternalToast) =>
    sonner.error(title, { description, ...withDefaults(opts) }),

  /**
   * Shows a notification from an unknown error value.
   *
   * @remarks
   * - Abort errors are displayed as informational cancellations.
   * - HTTP errors use a status-based title and a resolved domain/UI description fallback.
   * - Plain `Error` and string values are resolved directly when they look like tokens.
   */
  fromError(
    error: unknown,
    fallback: UiErrorToken = UiError.errorGeneric,
    labels?: NotifyFromErrorLabels,
    resolve?: ResolveKey,
    opts?: ExternalToast,
  ) {
    const titleAbort = resolveUiMessage(
      labels?.abortTitle ?? UiError.operationCancelled,
      resolve,
    );
    const descAbort = resolveUiMessage(
      labels?.abortDescription ?? UiError.requestAborted,
      resolve,
    );

    const titleError = resolveUiMessage(
      labels?.errorTitle ?? UiError.errorGeneric,
      resolve,
    );

    const resolvedFallback = resolveUiMessage(fallback, resolve);

    if (isAbortError(error)) {
      return sonner.info(titleAbort, {
        description: descAbort,
        ...withDefaults(opts),
      });
    }

    if (isHttpError(error)) {
      const title = resolveUiMessage(statusToTitleToken(error.status), resolve);

      const raw = pickMessage(error, String(fallback)).trim();
      const hasRaw = raw.length > 0;

      // Prefer a status-based description token when the API does not provide a useful message.
      const descToken = hasRaw ? raw : statusToDescToken(error.status);
      const desc = resolveUiMessage(descToken, resolve);

      return sonner.error(title, {
        description: desc,
        ...withDefaults(opts),
      });
    }

    if (error instanceof Error || typeof error === "string") {
      const desc = resolveUiMessage(
        pickMessage(error, String(fallback)),
        resolve,
      );
      return sonner.error(titleError, {
        description: desc,
        ...withDefaults(opts),
      });
    }

    return sonner.error(titleError, {
      description: resolvedFallback,
      ...withDefaults(opts),
    });
  },
} as const;
