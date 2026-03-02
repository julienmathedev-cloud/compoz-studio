/**
 * @file apps/studio/src/lib/api/response.ts
 * @layer lib/api
 * @description
 * Helpers standardisés pour produire des réponses JSON dans l’App Router :
 * succès (`jsonOk`) et erreurs normalisées (`jsonHttpError`, `serverError`),
 * avec cache désactivé via `Cache-Control: no-store`.
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import type { HttpErrorBody } from "@compoz/http/http-error";
import { NextResponse } from "next/server";

/**
 * En-têtes HTTP désactivant explicitement le cache.
 *
 * @remarks
 * Exporté pour être réutilisé dans d'autres helpers API (ou routes spécifiques)
 * sans dupliquer la règle `no-store`.
 */
export const NO_STORE_HEADERS: HeadersInit = { "Cache-Control": "no-store" };

/**
 * Forme standard d’une erreur d'API. Tous les helpers d'erreur
 * produisent une réponse JSON conforme à cette structure.
 */
export type ApiErrorBody = {
  error: {
    /** Code d’erreur stable : souvent une valeur de l’enum métier. */
    code: ErrorCode | string;
    /** Message clair destiné aux logs ou au client (selon contexte). */
    message: string;
    /** Propriétés supplémentaires facultatives (ex: issues, détails…). */
    [k: string]: unknown;
  };
};

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
 * Non exporté directement : utilisé par les helpers publics `serverError`
 * et `jsonHttpError`.
 *
 * @param code    Code d’erreur métier stable.
 * @param message Message lisible (obligatoire côté appelant).
 * @param status  Statut HTTP de la réponse.
 * @param extras  Champs additionnels à inclure (ex: issues de validation).
 */
function jsonError(
  code: ApiErrorBody["error"]["code"],
  message: string,
  status = 400,
  extras?: Record<string, unknown>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(extras ?? {}) } },
    { status, headers: NO_STORE_HEADERS },
  );
}

/**
 * Helper pour produire une erreur serveur (500).
 *
 * - En production : message générique ("Internal server error.").
 * - En développement : détail du message réel (+ cause optionnelle).
 *
 * @param err Erreur brute (Error / string / inconnu).
 */
export function serverError(err: unknown): NextResponse<ApiErrorBody> {
  const isProd = process.env.NODE_ENV === "production";

  const detailed =
    err instanceof Error ? err.message : err ? String(err) : "Unknown error";

  const message = isProd ? "Internal server error." : detailed;

  // En dev, on peut exposer un petit contexte (sans stack énorme) pour debug.
  const extras = isProd
    ? undefined
    : {
        cause: err instanceof Error ? err.name : typeof err,
      };

  return jsonError(EC.INTERNAL, message, 500, extras);
}

/**
 * Conversion générique “status + HttpErrorBody” → réponse d’erreur JSON.
 *
 * Utilisé principalement par `handleRoute` pour transformer des erreurs HTTP
 * structurées (issues de Zod, DomainError, etc.) en réponse JSON cohérente.
 */
export function jsonHttpError(
  status: number,
  body: HttpErrorBody,
): NextResponse<ApiErrorBody> {
  const {
    code = EC.INTERNAL,
    message = "",
    ...rest
  } = body as HttpErrorBody & Record<string, unknown>;

  // Si aucun message n'est fourni, on retombe sur un token HTTP (i18n UI).
  const finalMessage = message || (code ? String(code) : `HTTP_${status}`);

  return jsonError(code, finalMessage, status, rest);
}
