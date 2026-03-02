/**
 * @file packages/http/src/http-error.ts
 * @layer transport/http
 * @description
 * Types + helpers génériques d'erreurs HTTP (sans dépendance Zod).
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

export type HttpErrorBody = {
  code: ErrorCode | string;
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
  throw { __http__: { status, body } } as WrappedHttpError;
}

type UnknownObject = Record<string, unknown>;

export function isUnknownObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null;
}
