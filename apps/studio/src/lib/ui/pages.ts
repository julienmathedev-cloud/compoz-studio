/**
 * @file apps/studio/src/lib/ui/pages.ts
 * @layer studio/lib/ui
 * @description
 * Utilitaires pour l’affichage des pages (formatage de slug → chemin affichable).
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

/**
 * Formate un slug pour affichage dans l’UI.
 * - "home" → "/"
 * - "/"    → "/"
 * - "abc"  → "/abc"
 */
export function formatPagePath(slug: string): string {
  const s = String(slug ?? "").trim();

  if (!s || s === HOME_SLUG || s === SITE_PATH.home) return SITE_PATH.home;

  const normalized = s.replace(/^\/+/, "");
  return `/${normalized}`;
}
