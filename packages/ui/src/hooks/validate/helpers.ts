/**
 * @file packages/ui/src/hooks/validate/helpers.ts
 * @layer hooks/shared
 *
 * @description
 * Helpers de validation légère et non bloquante destinés à l’UI.
 *
 * @remarks
 * - Helpers génériques non liés aux URLs.
 * - Les validations spécifiques aux URLs sont centralisées dans `src/lib/normalize.ts`.
 * - Utilisés pour des contrôles UI (doublons, incohérences mineures, avertissements).
 */

/**
 * Détecte la présence de doublons dans une liste de clés déjà normalisées.
 *
 * @remarks
 * - Implémentation en O(n) via `Set`.
 * - Destiné aux validations non bloquantes côté UI.
 */
export function hasDuplicates(keys: string[]): boolean {
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}
