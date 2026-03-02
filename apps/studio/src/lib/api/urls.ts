/**
 * @file apps/studio/src/lib/api/urls.ts
 * @layer admin/lib/api
 * @description
 * Helpers de parsing d’URL pour les routes API (App Router).
 * Interprétation stricte et read-only des query params.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

/**
 * Extrait le `ContentState` depuis les query params d’une requête HTTP.
 *
 * Règle stricte : seul `?state=published` est reconnu explicitement.
 * Toute autre valeur (absente, invalide, différente) retombe sur le `fallback`.
 *
 * @param req Requête HTTP brute (App Router).
 * @param fallback Valeur par défaut si aucun état valide n’est fourni.
 */
export function parseContentStateFromRequest(
  req: Request,
  fallback: ContentState = CONTENT_STATE.DRAFT,
): ContentState {
  const url = new URL(req.url);
  const raw = url.searchParams.get("state");

  if (!raw) return fallback;

  return raw.trim().toLowerCase() === CONTENT_STATE.PUBLISHED
    ? CONTENT_STATE.PUBLISHED
    : fallback;
}
