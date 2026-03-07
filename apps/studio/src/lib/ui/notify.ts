"use client";

/**
 * @file apps/studio/src/lib/ui/notify.ts
 * @layer studio/lib/ui
 * @description
 * Façade de notifications (Sonner) pour le Studio.
 *
 * Contrat i18n :
 * - Les erreurs UI utilisent `uiErrors.<token>` (camelCase).
 * - Les erreurs domaine utilisent `errors.<CODE>` (MAJUSCULE_SNAKE_CASE).
 * - Un resolver global peut être configuré via `notify.configure`.
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

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

const DEFAULTS = { duration: 3500 } as const;

/**
 * Resolver global (optionnel) configuré par un Provider.
 * Permet de traduire les tokens sans modifier tous les appels.
 */
let globalResolve: ResolveKey | undefined;

function withDefaults(opts?: ExternalToast): ExternalToast {
  return { ...DEFAULTS, ...(opts ?? {}) };
}

/* -------------------------------------------------------------------------- */
/*                              Message resolving                              */
/* -------------------------------------------------------------------------- */

function resolveUiMessage(input: string, resolve?: ResolveKey): string {
  const r = resolve ?? globalResolve;
  if (!r) return input;

  if (isTokenLike(input)) {
    const out = resolveMessage(input, r);
    // Si le resolver ne sait pas traduire, `resolveMessage` retourne `input`.
    if (out !== input) return out;

    // Fallback stable UI
    const fallbackKey = "uiErrors." + UiError.errorGeneric;
    const g = r(fallbackKey);
    return g && g !== fallbackKey ? g : input;
  }

  // Déjà un message humain
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
      return UiError.http400Title; // "Requête invalide"
    case 401:
      return UiError.http401Title; // "Non authentifié"
    case 403:
      return UiError.http403Title; // "Accès refusé"
    case 404:
      return UiError.http404Title; // "Introuvable"
    case 405:
      return UiError.http405Title; // "Action non autorisée"
    case 409:
      return UiError.http409Title; // "Conflit"
    case 422:
      return UiError.http422Title; // "Erreur de validation"
    default:
      return status >= 500 ? UiError.serverError : UiError.errorGeneric;
  }
}

/**
 * Token description par défaut pour les erreurs HTTP,
 * afin de conserver un message UI stable (ex: http404) même si l'infra renvoie
 * un fallback générique (UNKNOWN/INTERNAL).
 */
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

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type NotifyFromErrorLabels = Readonly<{
  abortTitle?: string;
  abortDescription?: string;
  errorTitle?: string;
}>;

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export const notify = {
  /**
   * Configure le resolver global (i18n).
   * À appeler une seule fois côté client (via un Provider).
   */
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
   * Affiche une notification à partir d’une erreur inconnue.
   *
   * Règles :
   * - Abort → info
   * - HTTP autres → title basé sur status + desc résolue (domaine/UI) avec fallback status-based
   * - Error / string → message résolu
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

      // Si le message est générique, on préfère une desc stable par status (http404, etc.)
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
