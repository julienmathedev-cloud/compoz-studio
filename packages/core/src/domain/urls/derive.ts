/**
 * @file src/core/domain/urls/derive.ts
 * @layer core/domain
 * @description
 * Dérive des URLs brandées (`AssetUrl`, `AssetUrlOrNull`) à partir de strings déjà validées.
 * Ce module ne réalise aucun contrôle de format ou de sécurité ; il se limite à
 * appliquer le branding Domain (URL absolue vs relative).
 */

import {
  abs,
  rel,
  type AssetUrl,
  type AssetUrlOrNull,
} from "@compoz/core/domain/urls/href";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isHttpAbsoluteUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://");
}

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Convertit une string **déjà validée** en `AssetUrl`.
 *
 * Détail :
 * - On trim la valeur.
 * - Si http:// ou https:// → `abs()`
 * - Sinon                  → `rel()`
 *
 * Utilisé dans les cas où Zod garantit déjà que `input` est une URL
 * autorisée (ex: AssetUrlSchema).
 */
export function asAssetUrl(input: string): AssetUrl {
  const s = input.trim();
  return isHttpAbsoluteUrl(s) ? abs(s) : rel(s);
}

/**
 * Variante tolérante :
 * - `null` ou `undefined`      → `null`
 * - chaîne vide après trim     → `null`
 * - sinon → même règle que `asAssetUrl`
 *
 * Très utile pour les champs optionnels (OpenGraph image, favicon, etc.)
 * où une chaîne vide doit être considérée comme "valeur absente".
 */
export function asAssetUrlOrNull(
  input: string | null | undefined,
): AssetUrlOrNull {
  if (input == null) return null;

  const s = input.trim();
  if (s === "") return null;

  return isHttpAbsoluteUrl(s) ? abs(s) : rel(s);
}
