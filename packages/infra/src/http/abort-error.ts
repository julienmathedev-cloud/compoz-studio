/**
 * @file packages/infra/src/http/abort-error.ts
 * @layer infra/http
 * @description
 * Helpers liés à l'annulation (AbortController / AbortError) côté infra HTTP.
 *
 * @remarks
 * On gère plusieurs formes d'erreurs possibles :
 * 1) DOMException (browser)
 * 2) Error standard (avec support de `cause`)
 * 3) Objet "plain" (ex: erreur sérialisée côté SSR)
 */

import { isUnknownObject } from "@compoz/http/http-error";

/**
 * @description Factory minimale pour centraliser la création d'un AbortController.
 */
export function newAbort(): AbortController {
  return new AbortController();
}

/**
 * @description Noms d'erreurs fréquemment utilisés pour représenter une annulation.
 */
const ABORT_ERROR_NAMES = new Set([
  "AbortError",
  "CanceledError",
  "CancelledError",
]);

function messageLooksLikeAbort(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("aborted") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}

/**
 * @description Détermine si une erreur inconnue correspond à une annulation (abort/cancel).
 */
export function isAbortError(error: unknown): boolean {
  // 1) Browser native
  if (
    typeof globalThis.DOMException !== "undefined" &&
    error instanceof globalThis.DOMException
  ) {
    return error.name === "AbortError";
  }

  // 2) Standard Error
  if (error instanceof Error) {
    if (ABORT_ERROR_NAMES.has(error.name)) return true;

    const cause = (error as { cause?: unknown }).cause;
    if (cause && isAbortError(cause)) return true;

    if (messageLooksLikeAbort(String(error.message ?? ""))) {
      return true;
    }

    return false;
  }

  // 3) Plain object (SSR serialized)
  if (isUnknownObject(error)) {
    const obj = error as Record<string, unknown>;

    const name = obj["name"];
    if (typeof name === "string" && ABORT_ERROR_NAMES.has(name)) return true;

    const cause = obj["cause"];
    if (cause && isAbortError(cause)) return true;

    const message = obj["message"];
    if (typeof message === "string" && messageLooksLikeAbort(message)) {
      return true;
    }
  }

  return false;
}
