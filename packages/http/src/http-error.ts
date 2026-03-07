/**
 * @file packages/http/src/http-error.ts
 * @layer transport/http
 * @description
 * Types + helpers génériques d'erreurs HTTP (sans dépendance Zod).
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

/**
 * Code d'erreur retourné par l'API :
 * - soit un code métier (ErrorCode)
 * - soit un code libre (string) pour des cas infra/adapters ou erreurs externes
 */
export type HttpErrorCode = ErrorCode | (string & {});

export type HttpErrorBody = {
  code: HttpErrorCode;
  issues?: Array<{ path: string; message: string }>;
  message?: string;
  [k: string]: unknown;
};

export type HttpErrorPayload = {
  status: number;
  body: HttpErrorBody;
};

export type WrappedHttpError = { __http__: HttpErrorPayload };

export function throwHttp(status: number, body: HttpErrorBody): never {
  const err: WrappedHttpError = { __http__: { status, body } };
  throw err;
}

type UnknownRecord = Record<string, unknown>;

export function isUnknownObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
