/**
 * @file packages/core/src/domain/errors/domain-error.ts
 * @layer core/domain/errors
 * @description Stable, serializable domain error independent from transport or UI concerns.
 * @remarks
 * Used by use cases and mapped by adapters such as HTTP or UI layers.
 */

import { isErrorCode, type ErrorCode } from "@compoz/core/domain/errors/codes";

type DomainErrorInit = {
  /** Strict domain code from `ERROR_CODES`. */
  code: ErrorCode;

  message?: string;

  details?: unknown;

  /** Original technical or domain cause, compatible with standard `Error.cause`. */
  cause?: unknown;
};

/**
 * Minimal stable domain error compatible with adapter-level serialization.
 */
export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor({ code, message, details, cause }: DomainErrorInit) {
    // Native `cause` support when available in the runtime.
    super(message ?? code, cause !== undefined ? { cause } : undefined);

    this.name = "DomainError";
    this.code = code;
    this.details = details;

    // Keep `instanceof DomainError` reliable across JS/TS inheritance targets.
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture a clean stack trace when the runtime supports it.
    Error.captureStackTrace?.(this, DomainError);
  }

  /** Serializable shape for logs, tests, and serverless diagnostics. */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
    };
  }
}

/** Checks whether an unknown value exposes a string `code` property. */
function hasStringCode(value: unknown): value is { code: string } {
  if (value === null || typeof value !== "object") return false;

  const v = (value as { code?: unknown }).code;
  return typeof v === "string";
}

/**
 * Loose guard for distinguishing domain-like errors from technical errors.
 *
 * It only requires a string `code`; it does not enforce `ERROR_CODES` membership or `name === "DomainError"`.
 */
export function isDomainErrorLike(e: unknown): e is { code: string } {
  return hasStringCode(e);
}

/** Strict guard for adapter code that requires a known stable `ErrorCode`. */
export function isStrictDomainError(e: unknown): e is DomainError {
  return hasStringCode(e) && isErrorCode(e.code);
}
