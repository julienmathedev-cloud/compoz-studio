/**
 * @file packages/http/src/envelope.ts
 * @layer transport/http
 * @description Helpers for standard API error envelopes.
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

/** Allows canonical domain error codes plus adapter-specific string codes. */
export type ApiErrorCode = ErrorCode | (string & {});

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    [k: string]: unknown;
  };
};

export function buildErrorEnvelope(
  code: ApiErrorCode,
  message: string,
  extras?: Record<string, unknown> | undefined,
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
      ...(extras ?? {}),
    },
  };
}
