/**
 * @file apps/site/src/lib/api/responses.ts
 * @layer site/lib/api
 * @description
 * Helpers standardisés pour produire des réponses JSON dans l’App Router :
 * succès (`jsonOk`) et erreurs normalisées (`jsonHttpError`),
 * avec cache désactivé via `Cache-Control: no-store`.
 */

import { NextResponse } from "next/server";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import {
  buildErrorEnvelope,
  type ApiErrorEnvelope,
} from "@compoz/http/envelope";
import type { HttpErrorBody } from "@compoz/http/http-error";

/**
 * En-têtes HTTP désactivant explicitement le cache.
 *
 * @remarks
 * Exporté pour être réutilisé dans d'autres helpers API (ou routes spécifiques)
 * sans dupliquer la règle `no-store`.
 */
export const NO_STORE_HEADERS: HeadersInit = { "Cache-Control": "no-store" };

/**
 * Réponse JSON de succès (status par défaut : 200).
 *
 * @param data   Contenu JSON à renvoyer.
 * @param status Code HTTP facultatif (200 par défaut).
 */
export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json<T>(data, { status, headers: NO_STORE_HEADERS });
}

/**
 * Génère une réponse JSON d'erreur normalisée.
 * Non exporté directement : utilisé par le helper public `jsonHttpError`.
 *
 * @param code    Code d’erreur métier stable.
 * @param message Message lisible (obligatoire côté appelant).
 * @param status  Statut HTTP de la réponse.
 * @param extras  Champs additionnels à inclure (ex: issues de validation).
 */
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

/**
 * Conversion générique “status + HttpErrorBody” → réponse d’erreur JSON.
 *
 * @remarks
 * Utilisé principalement par `handleRoute` pour transformer des erreurs HTTP
 * structurées (issues de Zod, DomainError, etc.) en réponse JSON cohérente.
 */
export function jsonHttpError(
  status: number,
  body: HttpErrorBody,
): NextResponse<ApiErrorEnvelope> {
  const {
    code = EC.INTERNAL,
    message = "",
    ...rest
  } = body as HttpErrorBody & Record<string, unknown>;

  // Si aucun message n'est fourni, on retombe sur un token HTTP (i18n UI).
  const finalMessage = message || (code ? String(code) : `HTTP_${status}`);

  return jsonError(code, finalMessage, status, rest);
}
