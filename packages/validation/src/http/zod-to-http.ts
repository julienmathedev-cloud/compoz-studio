/**
 * @file packages/validation/src/http/zod-to-http.ts
 * @layer schemas
 * @description
 * Helpers de conversion de Zod → HTTP (erreurs).
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
  /**
   * Code d'erreur "token" (stable) renvoyé au client.
   * Peut être un `ErrorCode` (recommandé) ou une string custom.
   */
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
 * Garde de type pour détecter une erreur lancée via `throwHttp`.
 *
 * @remarks
 * On vérifie une forme minimale pour éviter les faux positifs :
 * - err.__http__.status number
 * - err.__http__.body object avec `code`
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
 * Transforme une erreur inconnue en représentation HTTP standardisée,
 * lorsque c'est possible.
 *
 * Cas gérés :
 * 1) Erreurs "maison" lancées via `throwHttp` :
 *    - on renvoie directement { status, body }.
 * 2) `ZodError` :
 *    - renvoie 400 + code VALIDATION_ERROR + liste d'issues (path/message).
 *
 * Si l'erreur ne correspond à aucun de ces cas, retourne `null`.
 * Dans ce cas, `handleRoute` utilisera un fallback 500.
 */
export function zodToHttp(err: unknown): HttpErrorPayload | null {
  // 1) Erreurs "maison" (ex. readJsonOr400, validations custom)
  if (isWrappedHttpError(err)) {
    return err.__http__;
  }

  // 2) Erreurs Zod standardisées
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: ERROR_CODES.VALIDATION_ERROR,
        // Message i18n-friendly : token stable (les détails sont dans `issues`).
        message: ERROR_CODES.VALIDATION_ERROR,
        issues: zodIssuesToHttp(err.issues),
      },
    };
  }

  // 3) Non géré ici → fallback 500 plus haut dans la stack (handleRoute)
  return null;
}
