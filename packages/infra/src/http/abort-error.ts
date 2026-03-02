/**
 * @file packages/infra/src/http/abort-error.ts
 * @layer infra/http
 */

import { isUnknownObject } from "@compoz/http/http-error";

export function newAbort(): AbortController {
  return new AbortController();
}

const CANCEL_NAMES = new Set(["AbortError", "CanceledError", "CancelledError"]);

function messageLooksLikeAbort(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("aborted") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}

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
    if (CANCEL_NAMES.has(error.name)) return true;

    const cause = (error as { cause?: unknown }).cause;
    if (cause && isAbortError(cause)) return true;

    if (messageLooksLikeAbort(String(error.message ?? ""))) {
      return true;
    }

    return false;
  }

  // 3) Plain object (SSR serialized)
  if (isUnknownObject(error)) {
    const name = error["name"];
    if (typeof name === "string" && CANCEL_NAMES.has(name)) return true;

    const cause = error["cause"];
    if (cause && isAbortError(cause)) return true;

    const message = error["message"];
    if (typeof message === "string" && messageLooksLikeAbort(message)) {
      return true;
    }
  }

  return false;
}
