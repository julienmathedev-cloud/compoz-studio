/**
 * @file packages/core/src/domain/site/_shared/merge.ts
 * @layer core/domain/site/_shared
 * @description
 * Helpers de merge **shallow** pour objets :
 * - fusionner un patch partiel en ignorant `undefined`,
 * - obtenir la liste des clés réellement modifiées.
 */

/**
 * Fusionne `patch` dans `base` de manière **shallow** et retourne :
 * - l’objet résultant (`next`),
 * - la liste des clés dont la valeur a effectivement changé (`changedKeys`).
 *
 * Règles :
 * - `patch` est considéré comme une mise à jour partielle.
 * - Les valeurs `undefined` dans le patch sont ignorées (pas de modification).
 * - La comparaison se fait via `Object.is` pour bien gérer `NaN`, `-0`, etc.
 */
export function shallowMergeWithChangedKeys<T extends object>(
  base: Readonly<T>,
  patch: Readonly<Partial<T>>,
): { next: T; changedKeys: ReadonlyArray<keyof T> } {
  const next: T = { ...base };
  const changedKeys: (keyof T)[] = [];

  for (const k of Object.keys(patch) as (keyof T)[]) {
    const v = patch[k];

    // Une valeur undefined dans le patch est considérée comme "neutre".
    if (v === undefined) continue;

    if (!Object.is(base[k], v)) {
      next[k] = v as T[typeof k];
      changedKeys.push(k);
    }
  }

  return { next, changedKeys };
}
