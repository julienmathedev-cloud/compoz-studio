/**
 * @file packages/http/src/http-error.ts
 * @layer transport/http
 * @description Generic HTTP error types and helpers without Zod dependency.
 */

import type { ErrorCode } from "@compoz/core/domain/errors/codes";

/** Allows canonical domain error codes plus adapter-specific string codes. */
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
