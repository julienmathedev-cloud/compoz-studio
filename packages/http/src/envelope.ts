/**
 * @file packages/http/src/envelope.ts
 * @layer transport/http
 * @description
 * Helpers purs pour produire des enveloppes d'erreur standardisées.
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

export type ApiErrorEnvelope = {
  error: {
    code: ErrorCode | string;
    message: string;
    [k: string]: unknown;
  };
};

export function buildErrorEnvelope(
  code: ErrorCode | string,
  message: string,
  extras?: Record<string, unknown>,
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
      ...(extras ?? {}),
    },
  };
}
