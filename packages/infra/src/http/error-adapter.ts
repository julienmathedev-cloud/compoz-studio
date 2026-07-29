/**
 * @file packages/infra/src/http/error-adapter.ts
 * @layer infra/http
 * @description Converts domain and validation errors into HTTP responses.
 * @remarks
 * Production responses hide technical messages while preserving stable error codes.
 */

import {
  ERROR_CODES,
  isErrorCode,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { isStrictDomainError } from "@compoz/core/domain/errors/domain-error";
import type { HttpErrorBody } from "@compoz/http/http-error";
import { zodToHttp } from "@compoz/validation/http/zod-to-http";

type HttpErrorResponse = Readonly<{ status: number; body: HttpErrorBody }>;
const EXPLICIT_STATUS: Partial<Record<ErrorCode, number>> = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.PAGE_NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.PUBLISH_CONFLICT]: 409,
  [ERROR_CODES.REVISION_REQUIRED]: 428,
  [ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT]: 409,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.INVALID_ARGUMENT]: 400,

  // Generic fallbacks.
  [ERROR_CODES.INTERNAL]: 500,
  [ERROR_CODES.UNKNOWN]: 500,
};

const DOMAIN_ERROR_DETAILS_HTTP_ALLOWLIST = new Set<ErrorCode>([
  ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
]);

const INFRA_CODE_PREFIXES_500 = [
  /^REPO_/,
  /^DB_/,
  /^STORAGE_/,
] as const;

function shouldExposeMessage(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function statusFromCode(code: string): number {
  if (!isErrorCode(code)) return 500;

  const explicit = EXPLICIT_STATUS[code];
  if (explicit !== undefined) return explicit;

  if (INFRA_CODE_PREFIXES_500.some((re) => re.test(code))) return 500;

  return 400;
}

function toHttpErrorBody(err: unknown): HttpErrorBody {
  if (!isStrictDomainError(err)) {
    return { code: ERROR_CODES.UNKNOWN };
  }

  const base: HttpErrorBody = { code: err.code };

  if (shouldExposeMessage() && err.message) {
    base.message = err.message;
  }

  if (
    err.details !== undefined &&
    DOMAIN_ERROR_DETAILS_HTTP_ALLOWLIST.has(err.code)
  ) {
    base.details = err.details;
  }

  return base;
}

export function toHttpError(err: unknown): HttpErrorResponse {
  const z = zodToHttp(err);
  if (z) return z;

  const body = toHttpErrorBody(err);
  const status = statusFromCode(String(body.code));
  return { status, body };
}
