/**
 * @file apps/site/src/lib/api/responses.ts
 * @layer site/lib/api
 * @description
 * Standard JSON response helpers for Site App Router routes.
 *
 * @remarks
 * - Success and error responses are returned through `NextResponse.json` with `Cache-Control: no-store`.
 * - Error responses follow the shared `ApiErrorEnvelope` shape from `@compoz/http`.
 * - Used directly by routes and by `handleRoute()`.
 */

import { NextResponse } from "next/server";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import {
  buildErrorEnvelope,
  type ApiErrorEnvelope,
} from "@compoz/http/envelope";
import type { HttpErrorBody } from "@compoz/http/http-error";

/** Shared API headers that explicitly disable response caching. */
export const NO_STORE_HEADERS: HeadersInit = { "Cache-Control": "no-store" };

/** Builds a no-store JSON success response. */
export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json<T>(data, { status, headers: NO_STORE_HEADERS });
}

/** Builds a normalized no-store JSON error response. */
function jsonError(
  code: ApiErrorEnvelope["error"]["code"],
  message: string,
  status = 400,
  extras?: Record<string, unknown>,
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json<ApiErrorEnvelope>(
    buildErrorEnvelope(code, message, extras),
    { status, headers: NO_STORE_HEADERS },
  );
}

/** Converts a structured HTTP error body into the shared JSON error envelope. */
export function jsonHttpError(
  status: number,
  body: HttpErrorBody,
): NextResponse<ApiErrorEnvelope> {
  const {
    code = EC.INTERNAL,
    message = "",
    ...rest
  } = body as HttpErrorBody & Record<string, unknown>;

  // Fall back to a stable token so the UI can still resolve the error through i18n.
  const finalMessage = message || (code ? String(code) : `HTTP_${status}`);

  return jsonError(code, finalMessage, status, rest);
}
