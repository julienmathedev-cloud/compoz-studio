/**
 * @file packages/ui/src/lib/build-shallow-diff.ts
 * @layer ui/lib/object
 *
 * @description
 * Helper pour construire un diff minimal (shallow) entre deux objets afin de produire
 * des patchs partiels (ex: requêtes PATCH) sans renvoyer de données inchangées.
 *
 * Conçu pour :
 * - minimiser les payloads PATCH côté UI
 * - éviter l'envoi de champs inchangés
 *
 * Limites assumées :
 * - Diff **shallow** (1 niveau).
 * - Pas de gestion des suppressions : seules les clés présentes dans `next`
 *   peuvent apparaître dans le patch.
 */

/**
 * Construit un diff minimal entre deux objets (shallow, 1 niveau).
 *
 * Règles :
 * - Parcourt uniquement les clés présentes dans `next`
 *   (considéré comme la source de vérité).
 * - Compare `prev[k]` et `next[k]` avec `Object.is` :
 *   - Si la valeur change → incluse dans le patch.
 *   - Sinon → ignorée.
 * - Si aucune clé ne change → retourne `null`.
 *
 * @param prev Objet précédent (référence initiale, lecture seule)
 * @param next Objet suivant (valeurs à comparer, lecture seule)
 *
 * @returns Un patch partiel (`Partial<T>`) ou `null` si aucune modification détectée
 */
export function buildShallowDiff<T extends Record<string, unknown>>(
  prev: Readonly<T>,
  next: Readonly<T>,
): Partial<T> | null {
  const out: Partial<T> = {};
  let changed = false;

  const keys = Object.keys(next) as (keyof T)[];

  for (const k of keys) {
    // Object.is gère correctement NaN, -0, etc.
    if (!Object.is(prev[k], next[k])) {
      out[k] = next[k];
      changed = true;
    }
  }

  return changed ? out : null;
}
