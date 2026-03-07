/**
 * @file packages/ui/src/lib/urls/formats.ts
 * @layer ui/lib/urls
 * @description
 * Helpers de formatage d’URL/chemins (string-only) : suppression de slashes terminaux
 * et composition `base + path` sans double slash.
 *
 * ⚠️ Volontairement minimal : pas de validation, pas de parsing avancé.
 * ⚠️ Le terme "canonical" ici est un abus de langage : ce helper **compose** une URL,
 *    il ne produit pas une URL canonique SEO.
 */

/**
 * Supprime les slashes terminaux d'une URL ou d'un chemin.
 * Cas particulier :
 * - "/" reste "/" (on évite de produire une string vide pour une racine).
 *
 * Si `u` est `undefined`, on renvoie `undefined`.
 */

// Surcharges TS pour un typing plus précis.
export function stripTrailingSlashes(u: string): string;
export function stripTrailingSlashes(u?: string): string | undefined;
export function stripTrailingSlashes(u?: string): string | undefined {
  if (u == null) return undefined;
  if (u === "/") return "/";

  // Note : on ne trim pas ici volontairement, c'est un helper "format" bas niveau.
  return u.replace(/\/+$/, "");
}

/**
 * Concatène une URL de base et un chemin, en évitant les doubles slashes.
 *
 * - Retire les slashes finaux de la base.
 * - Retire les slashes initiaux du path.
 * - Assemble par un unique slash.
 *
 * @param base URL de base (peut être `undefined`)
 * @param path Chemin à ajouter
 * @returns URL complète, ou `undefined` si `base` est vide ou non définie.
 */
export function canonicalFromBase(
  base: string | undefined,
  path: string,
): string | undefined {
  const b = stripTrailingSlashes(base);
  if (!b) return undefined;

  const rawPath = (path ?? "").trim();
  if (!rawPath || rawPath === "/") return b;

  const p = rawPath.replace(/^\/+/, "");
  return `${b}/${p}`;
}
