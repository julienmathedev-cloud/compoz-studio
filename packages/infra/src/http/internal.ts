/**
 * @file packages/infra/src/http/internal.ts
 * @layer infra/http
 * @description
 * Helpers HTTP pour le client Studio : gestion du query `state`, encodage des slugs,
 * et options standardisées pour les fetchers.
 *
 * Responsabilités : construction de routes, URL-safe, préparation d’options fetch.
 * Aucun traitement métier — uniquement utilitaires front.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

/**
 * Ajoute le paramètre `?state=…` à l’URL si différent du défaut.
 * Contrat : renvoie une URL correcte sans doublons.
 */
export function withState(path: string, state: ContentState): string {
  if (state === DEFAULT_CONTENT_STATE) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}state=${state}`;
}

/**
 * Options génériques pour les fetchers du client Studio.
 * Contrat : `signal` optionnel pour annuler la requête.
 */
export type HttpOpts = Readonly<{ signal?: AbortSignal }>;

/**
 * Encode un segment d’URL (id/slug/etc.) pour insertion dans une route.
 * Contrat : trim préalable, sortie URL-safe.
 */
export function encodeSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

/**
 * @description Assert runtime : ces endpoints doivent retourner du JSON en cas de succès.
 */
export function assertJsonResponse<T>(res: T | null, errorMessage: string): T {
  if (!res) {
    throw new Error(errorMessage);
  }
  return res;
}
