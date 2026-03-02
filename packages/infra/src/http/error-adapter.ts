/**
 * @file packages/infra/src/http/error-adapter.ts
 * @layer infra/http
 * @description
 * Adaptateur DomainError → HTTP : conversion des erreurs métier en status et body JSON.
 *
 * Responsabilités : mapping explicite des codes “spéciaux”, fallback 400 pour
 * les erreurs métier (validation), et restriction de l’exposition des messages
 * côté production.
 */

import { ERROR_CODES, type ErrorCode } from "@compoz/core/domain/errors/codes";
import { isStrictDomainError } from "@compoz/core/domain/errors/domain-error";
import type { HttpErrorBody } from "@compoz/http/http-error";
import { zodToHttp } from "@compoz/validation/http/zod-to-http";

/**
 * Mapping explicite ErrorCode → status HTTP.
 */
const EXPLICIT_STATUS: Partial<Record<ErrorCode, number>> = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.PAGE_NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.INVALID_ARGUMENT]: 400,

  // Erreurs génériques
  [ERROR_CODES.INTERNAL]: 500,
  [ERROR_CODES.UNKNOWN]: 500,
};

const INFRA_PREFIXES_500 = [/^REPO_/, /^FS_/, /^DB_/, /^STORAGE_/] as const;

/**
 * Détermine si le message d’erreur métier peut être exposé au client.
 * Contrat : en dev, toujours true ; en prod, restreint via EXPOSE_MESSAGE_WHEN_PROD.
 */
function shouldExposeMessage(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Type-guard : vérifie qu’un code runtime fait bien partie de notre enum ErrorCode.
 * (utile car HttpErrorBody.code est `ErrorCode | string`)
 */
function isKnownErrorCode(code: string): code is ErrorCode {
  return (Object.values(ERROR_CODES) as string[]).includes(code);
}

/**
 * Résout le status HTTP à partir d’un ErrorCode (ou d’un code inconnu).
 *
 * Contrat :
 * - codes “spéciaux” → EXPLICIT_STATUS
 * - préfixes infra → 500
 * - tout le reste (métier/validation) → 400
 * - code inconnu → 500 (safe fallback)
 */
export function statusFromCode(code: string): number {
  if (!isKnownErrorCode(code)) return 500;

  const explicit = EXPLICIT_STATUS[code];
  if (explicit !== undefined) return explicit;

  if (INFRA_PREFIXES_500.some((re) => re.test(code))) return 500;

  return 400;
}

/**
 * Transforme une erreur inconnue ou DomainError en HttpErrorBody.
 * Contrat : expose code et message si autorisé par shouldExposeMessage.
 */
function toHttpErrorBody(err: unknown): HttpErrorBody {
  if (!isStrictDomainError(err)) {
    return { code: ERROR_CODES.UNKNOWN };
  }

  const base: HttpErrorBody = { code: err.code };

  if (shouldExposeMessage() && err.message) {
    base.message = err.message;
  }

  return base;
}

/**
 * Transforme une erreur en réponse HTTP typée.
 * Contrat : retourne { status, body } utilisable directement dans les route handlers.
 */
export function toHttpError(
  err: unknown,
): Readonly<{ status: number; body: HttpErrorBody }> {
  // ✅ 1️⃣ Validation & throwHttp (validation package)
  const z = zodToHttp(err);
  if (z) return z;

  // ✅ 2️⃣ DomainError
  const body = toHttpErrorBody(err);
  const status = statusFromCode(String(body.code));
  return { status, body };
}
