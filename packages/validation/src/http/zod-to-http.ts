/**
 * @file packages/validation/src/http/zod-to-http.ts
 * @layer validation/http
 * @description
 * Converts Zod and validation errors into standardized HTTP payloads.
 */

import { ERROR_CODES, type ErrorCode } from "@compoz/core/domain/errors/codes";
import type {
  HttpErrorPayload,
  WrappedHttpError,
} from "@compoz/http/http-error";
import { isUnknownObject, throwHttp } from "@compoz/http/http-error";

import { ZodError, type ZodIssue, type ZodType } from "zod";

type ParseDTOOrHttpOptions = {
  status?: number;
  /** Stable client-facing error token; prefer shared `ErrorCode` values. */
  code?: ErrorCode | string;
  message?: string;
  extras?: Record<string, unknown>;
};

type HttpIssue = {
  path: string;
  message: string;
};

function zodIssuesToHttp(issues: ZodIssue[]): HttpIssue[] {
  return issues.map((i) => ({
    path: i.path.map(String).join("."),
    message: i.message,
  }));
}

function parseDTO<TSchema extends ZodType<unknown>>(
  schema: TSchema,
  input: unknown,
): TSchema["_output"] {
  const res = schema.safeParse(input);
  if (!res.success) throw res.error;
  return res.data;
}

export function parseDTOOrHttp<TSchema extends ZodType<unknown>>(
  schema: TSchema,
  input: unknown,
  opts?: ParseDTOOrHttpOptions,
): TSchema["_output"] {
  try {
    return parseDTO(schema, input);
  } catch (err) {
    if (err instanceof ZodError) {
      const status = opts?.status ?? 400;
      const code: string = opts?.code ?? ERROR_CODES.VALIDATION_ERROR;
      const message = opts?.message ?? code;

      throwHttp(status, {
        code,
        message,
        issues: zodIssuesToHttp(err.issues),
        ...(opts?.extras ?? {}),
      });
    }
    throw err;
  }
}

/**
 * Detects errors thrown by `throwHttp` using only the minimal expected shape.
 *
 * @remarks
 * The structural check avoids trusting arbitrary thrown objects as HTTP errors.
 */
function isWrappedHttpError(err: unknown): err is WrappedHttpError {
  if (!isUnknownObject(err)) return false;
  if (!Object.prototype.hasOwnProperty.call(err, "__http__")) return false;

  const http = (err as Record<string, unknown>).__http__;
  if (!isUnknownObject(http)) return false;

  const status = (http as Record<string, unknown>)["status"];
  const body = (http as Record<string, unknown>)["body"];

  if (typeof status !== "number") return false;
  if (!isUnknownObject(body)) return false;

  const code = (body as Record<string, unknown>)["code"];
  return typeof code === "string" && code.trim().length > 0;
}

/**
 * Converts known validation errors to HTTP payloads and lets unknown errors fall through.
 *
 * @remarks
 * Returning `null` intentionally delegates the final 500 fallback to the route layer.
 */
export function zodToHttp(err: unknown): HttpErrorPayload | null {
  // Custom HTTP errors already carry the final status and body.
  if (isWrappedHttpError(err)) {
    return err.__http__;
  }

  // Raw Zod errors are normalized before crossing the HTTP boundary.
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_CODES.VALIDATION_ERROR,
        issues: zodIssuesToHttp(err.issues),
      },
    };
  }

  // Unknown errors are handled by the route-level fallback.
  return null;
}
