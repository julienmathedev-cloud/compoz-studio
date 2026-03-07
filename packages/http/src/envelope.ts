/**
 * @file packages/http/src/envelope.ts
 * @layer transport/http
 * @description
 * Helpers purs pour produire des enveloppes d'erreur standardisées.
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

/**
 * Code d'erreur retourné par l'API :
 * - soit un code métier "canonique" (ErrorCode)
 * - soit un code libre (string) pour des cas infra/adapters ou erreurs externes
 */
export type ApiErrorCode = ErrorCode | (string & {});

/** Payload d'erreur standardisé côté API. */
export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    [k: string]: unknown;
  };
};

/**
 * @description Construit une enveloppe d'erreur API standardisée.
 */
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
