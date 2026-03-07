/**
 * @file apps/studio/src/lib/api/urls.ts
 * @layer studio/lib/api
 * @description
 * Helpers de parsing d’URL pour les routes API (App Router).
 * Interprétation stricte et read-only des query params.
 *
 * @remarks
 * - Convention stricte : seul `?state=published` est accepté explicitement.
 * - Toute autre valeur (absente, invalide, différente) retombe sur le `fallback`.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

/**
 * Extrait le `ContentState` depuis les query params d’une requête HTTP.
 *
 * @param req Requête HTTP brute (App Router).
 * @param fallback Valeur par défaut si aucun état valide n’est fourni.
 */
export function parseContentStateFromRequest(
  req: Request,
  fallback: ContentState = CONTENT_STATE.DRAFT,
): ContentState {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("state");
  if (!raw) return fallback;

  const state = raw.trim().toLowerCase();
  return state === CONTENT_STATE.PUBLISHED ? CONTENT_STATE.PUBLISHED : fallback;
}
