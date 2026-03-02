/**
 * @file apps/studio/src/lib/ui/pages.ts
 * @layer ui/lib
 * @description Utilitaires pour l’affichage des pages.
 */

/**
 * Formate un slug pour affichage dans l’UI.
 * - "home" → "/"
 * - "/"    → "/"
 * - "abc"  → "/abc"
 */
export function formatPagePath(slug: string): string {
  const s = String(slug ?? "").trim();

  if (!s || s === "home" || s === "/") return "/";

  const clean = s.replace(/^\/+/, "");
  return `/${clean}`;
}
