/**
 * @file packages/infra/src/lib/api-fetch.ts
 * @layer infra/lib/http
 * @description
 * Fetch JSON standardisé pour le client Studio : cache désactivé (`no-store`),
 * normalisation des erreurs HTTP via `HttpError`, et parsing JSON défensif.
 *
 * @remarks
 * - Ce module est volontairement UI-agnostic : aucun token UI (UiError) n'est produit ici.
 * - La traduction "HTTP status -> message UI" est gérée côté UI (notify).
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import { isUnknownObject } from "@compoz/http/http-error";

/* -------------------------------------------------------------------------- */
/*                               HttpError class                              */
/* -------------------------------------------------------------------------- */

/**
 * Représente une erreur HTTP normalisée côté client.
 *
 * - `status`: code HTTP (ex: 400, 404, 500)
 * - `code?`: code métier renvoyé par l’API (ex: "NOT_FOUND", "VALIDATION_ERROR")
 * - `body?`: corps JSON original de l’API (utile pour extraire des détails)
 */
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

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Envelope d’erreur standard émise par nos API Next.
 *
 * @remarks
 * - Format canonique : `{ error: { code?: string; message?: string; ... } }`
 * - Compat : certains endpoints peuvent renvoyer `{ error: string }`
 */
type ErrorEnvelope = {
  error: string | { code?: string; message?: string };
};

/** Vérifie si un JSON correspond à l’enveloppe d’erreur attendue. */
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

/**
 * Détecte les réponses du type `{ message: string }`
 * (cas générique hors enveloppe standard).
 */
function isMessageOnly(x: unknown): x is { message: string } {
  return isUnknownObject(x) && typeof x["message"] === "string";
}

/**
 * Vérifie si des en-têtes contiennent déjà `"Content-Type"`.
 * Gestion flexible : Headers, tableau ou objet simple.
 */
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

/** Indique si une réponse a *probablement* un corps JSON (Content-Type). */
function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get("content-type");
  return (
    typeof ct === "string" && ct.toLowerCase().includes("application/json")
  );
}

/* -------------------------------------------------------------------------- */
/*                                      API                                   */
/* -------------------------------------------------------------------------- */

/**
 * `apiFetch` — Fetch JSON standardisé pour le client Studio.
 *
 * Logique :
 * - Gère automatiquement les cas où un `Content-Type` JSON doit être ajouté.
 * - Force `cache: "no-store"` pour éviter les données obsolètes.
 * - Analyse proprement les erreurs HTTP et transforme la réponse en `HttpError`.
 *
 * @param input URL, Request ou string
 * @param init  Options fetch (RequestInit)
 * @returns Le JSON typé `T`, ou `null` si corps vide (ex: 204).
 */
export async function apiFetch<T>(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<T | null> {
  const shouldAddJsonContentType = shouldAddJsonContentTypeHeader(init);

  // Construction des en-têtes
  const headers: HeadersInit = shouldAddJsonContentType
    ? { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    : (init?.headers ?? {});

  // On s'assure que chaque requête Studio ne soit jamais servie depuis un cache
  const res = await fetch(input, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
    headers,
  });

  /* ------------------------------- Gestion erreurs ------------------------------- */

  if (!res.ok) {
    let code: ErrorCode | string | undefined;

    /**
     * Fallback UI-agnostic :
     * - 5xx -> INTERNAL
     * - autres -> UNKNOWN
     *
     * La couche UI décide ensuite d'afficher un message par status (http404, etc.)
     * si ce message est "trop générique".
     */
    let message: string = res.status >= 500 ? EC.INTERNAL : EC.UNKNOWN;

    let body: unknown;

    try {
      // On ne tente un JSON que si le Content-Type indique du JSON.
      if (isJsonResponse(res)) {
        body = await res.json();

        // Cas 1 : enveloppe standard d’erreur
        if (isErrorEnvelope(body)) {
          const e = body.error;

          if (typeof e === "string") {
            // Texte humain ou token prêt.
            message = e;
          } else {
            if (typeof e.code === "string") code = e.code;
            if (typeof e.message === "string") message = e.message;

            // Si l’API renvoie un code sans message, on utilise le code comme token.
            if (!e.message && code) message = String(code);
          }
        }
        // Cas 2 : JSON contenant juste un message
        else if (isMessageOnly(body)) {
          message = body.message;
        }
      }
    } catch {
      // corps vide / non JSON -> on conserve le fallback défini plus haut
    }

    // Normalisation finale : priorité au code métier si présent.
    if (code) message = String(code);

    // Fallback stable si rien n’a été extrait du corps.
    if (!message) {
      message = res.status >= 500 ? EC.INTERNAL : EC.UNKNOWN;
    }

    throw new HttpError(message, { status: res.status, code, body });
  }

  /* ------------------------------- Corps vide ------------------------------- */

  if (res.status === 204) {
    return null;
  }

  /* ------------------------------- JSON valide ? ------------------------------- */

  try {
    if (!isJsonResponse(res)) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                         Helpers supplémentaires                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                         Guards réutilisables (client)                       */
/* -------------------------------------------------------------------------- */

/**
 * Vérifie si une erreur est une HttpError créée par apiFetch.
 *
 * @remarks
 * - `instanceof` marche dans l'immense majorité des cas.
 * - En cas de sérialisation / boundary, on accepte aussi une forme "plain object"
 *   avec `name: "HttpError"` et `status: number`.
 */
export const isHttpError = (e: unknown): e is HttpError => {
  if (e instanceof HttpError) return true;

  return (
    isUnknownObject(e) &&
    e["name"] === "HttpError" &&
    typeof e["status"] === "number"
  );
};
