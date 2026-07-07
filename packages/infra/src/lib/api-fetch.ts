/**
 * @file packages/infra/src/lib/api-fetch.ts
 * @layer infra/lib/http
 * @description UI-agnostic JSON fetch helper for Studio clients.
 * @remarks
 * Error responses are normalized to `HttpError`; UI message mapping remains outside infra.
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { isUnknownObject } from "@compoz/http/http-error";

export class HttpError extends Error {
  readonly status: number;
  readonly code?: ErrorCode | string;
  readonly body?: unknown;

  constructor(
    message: string,
    opts: { status: number; code?: ErrorCode | string; body?: unknown },
  ) {
    super(message);
    this.name = "HttpError";
    this.status = opts.status;
    this.code = opts.code;
    this.body = opts.body;
  }
}

/** Standard API error envelope, with legacy string-error compatibility. */
type ErrorEnvelope = {
  error: string | { code?: string; message?: string };
};

function isErrorEnvelope(x: unknown): x is ErrorEnvelope {
  if (
    !isUnknownObject(x) ||
    !Object.prototype.hasOwnProperty.call(x, "error")
  ) {
    return false;
  }

  const e = (x as Record<string, unknown>)["error"];
  if (typeof e === "string") return true;
  return isUnknownObject(e) && ("code" in e || "message" in e);
}

function isMessageOnly(x: unknown): x is { message: string } {
  return isUnknownObject(x) && typeof x["message"] === "string";
}

function hasContentType(headers?: HeadersInit): boolean {
  if (!headers) return false;

  if (headers instanceof Headers) {
    return headers.has("Content-Type");
  }

  if (Array.isArray(headers)) {
    return headers.some(([k]) => k.toLowerCase() === "content-type");
  }

  return Object.keys(headers).some((k) => k.toLowerCase() === "content-type");
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get("content-type");
  return (
    typeof ct === "string" && ct.toLowerCase().includes("application/json")
  );
}

export async function apiFetch<T>(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<T | null> {
  const shouldAddJsonContentType = shouldAddJsonContentTypeHeader(init);

  const headers: HeadersInit = shouldAddJsonContentType
    ? { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    : (init?.headers ?? {});

  // Studio client requests must never reuse cached responses.
  const res = await fetch(input, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
    headers,
  });

  if (!res.ok) {
    let code: ErrorCode | string | undefined;

    let message: string = res.status >= 500 ? EC.INTERNAL : EC.UNKNOWN;

    let body: unknown;

    try {
      if (isJsonResponse(res)) {
        body = await res.json();

        if (isErrorEnvelope(body)) {
          const e = body.error;

          if (typeof e === "string") {
            message = e;
          } else {
            if (typeof e.code === "string") code = e.code;
            if (typeof e.message === "string") message = e.message;

            if (!e.message && code) message = String(code);
          }
        } else if (isMessageOnly(body)) {
          message = body.message;
        }
      }
    } catch {}

    if (code) message = String(code);

    if (!message) {
      message = res.status >= 500 ? EC.INTERNAL : EC.UNKNOWN;
    }

    throw new HttpError(message, { status: res.status, code, body });
  }

  if (res.status === 204) {
    return null;
  }

  try {
    if (!isJsonResponse(res)) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function shouldAddJsonContentTypeHeader(init?: RequestInit): boolean {
  const hasBody = !!(init && "body" in init && init.body != null);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const isUrlEncoded =
    typeof URLSearchParams !== "undefined" &&
    init?.body instanceof URLSearchParams;
  const isBlob = typeof Blob !== "undefined" && init?.body instanceof Blob;

  return (
    hasBody &&
    !hasContentType(init?.headers) &&
    !isFormData &&
    !isUrlEncoded &&
    !isBlob
  );
}

/** Detects `HttpError` across runtime boundaries where `instanceof` may fail. */
export const isHttpError = (e: unknown): e is HttpError => {
  if (e instanceof HttpError) return true;

  return (
    isUnknownObject(e) &&
    e["name"] === "HttpError" &&
    typeof e["status"] === "number"
  );
};
