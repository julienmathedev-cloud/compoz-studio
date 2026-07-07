/**
 * @file packages/infra/src/http/abort-error.ts
 * @layer infra/http
 * @description AbortController factory and abort-error detection helpers for HTTP infra.
 * @remarks
 * Detection accepts browser DOMException, standard Error with cause, and serialized SSR plain objects.
 */

import { isUnknownObject } from "@compoz/http/http-error";

export function newAbort(): AbortController {
  return new AbortController();
}

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

export function isAbortError(error: unknown): boolean {
  if (
    typeof globalThis.DOMException !== "undefined" &&
    error instanceof globalThis.DOMException
  ) {
    return error.name === "AbortError";
  }

  if (error instanceof Error) {
    if (ABORT_ERROR_NAMES.has(error.name)) return true;

    const cause = (error as { cause?: unknown }).cause;
    if (cause && isAbortError(cause)) return true;

    if (messageLooksLikeAbort(String(error.message ?? ""))) {
      return true;
    }

    return false;
  }

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
