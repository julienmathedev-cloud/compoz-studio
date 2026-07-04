/**
 * @file packages/ui/src/lib/website-id.ts
 * @layer ui/lib/website
 *
 * @description
 * Helpers UI/app pour normaliser un `websiteId`.
 *
 * @remarks
 * - UI-only : trim + lowercase pour éviter les collisions de cache et les variations de casing.
 * - Pas de fallback : si vide => null.
 * - Les callers décident : throw / return null / désactiver une query.
 * - À utiliser dans les query keys React Query, loaders app et helpers client.
 */

/**
 * Normalise un websiteId, trim + lowercase.
 * Retourne `null` si vide.
 */
export function toWebsiteId(input: unknown): string | null {
  const websiteId = String(input ?? "")
    .trim()
    .toLowerCase();

  return websiteId ? websiteId : null;
}

/**
 * Variante stricte : throw si websiteId vide.
 *
 * @remarks
 * Utile dans les hooks, query keys et helpers client où l’absence de scope
 * Website est une erreur de programmation.
 */
export function requireWebsiteId(input: unknown, where = "websiteId"): string {
  const websiteId = toWebsiteId(input);

  if (!websiteId) {
    throw new Error(`Missing ${where}`);
  }

  return websiteId;
}
