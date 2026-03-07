/**
 * @file packages/ui/src/lib/array.ts
 * @layer ui/lib/array
 *
 * @description
 * Helpers immuables pour manipuler des tableaux (UI-friendly).
 * - Aucun effet de bord.
 * - Retourne toujours une nouvelle instance.
 *
 * @remarks
 * Comportement strict (Option B) :
 * - `setAt` : si l'index est hors bornes => copie inchangée
 * - `removeAt` : si l'index est hors bornes => copie inchangée
 * - `insertAt` : si l'index est hors bornes => copie inchangée
 * - `moveItem` :
 *    - si `from` est hors bornes => copie inchangée
 *    - `to` est clampé dans [0..length-1] après retrait pour un comportement prévisible
 */

function isValidIndex(length: number, index: number): boolean {
  return index >= 0 && index < length;
}

function clampIndex(index: number, min: number, max: number): number {
  return Math.min(Math.max(index, min), max);
}

export function setAt<T>(arr: ReadonlyArray<T>, index: number, value: T): T[] {
  if (!isValidIndex(arr.length, index)) return Array.from(arr);

  const next = Array.from(arr);
  next[index] = value;
  return next;
}

export function removeAt<T>(arr: ReadonlyArray<T>, index: number): T[] {
  if (!isValidIndex(arr.length, index)) return Array.from(arr);

  const next = Array.from(arr);
  next.splice(index, 1);
  return next;
}

export function insertAt<T>(
  arr: ReadonlyArray<T>,
  index: number,
  value: T,
): T[] {
  // Option B : strict => on n'autorise que [0..length]
  // (insertion en fin possible avec index === length)
  if (index < 0 || index > arr.length) return Array.from(arr);

  const next = Array.from(arr);
  next.splice(index, 0, value);
  return next;
}

export function moveItem<T>(
  arr: ReadonlyArray<T>,
  from: number,
  to: number,
): T[] {
  if (from === to) return Array.from(arr);

  const next = Array.from(arr);
  if (!isValidIndex(next.length, from)) return next;

  const item = next[from];

  next.splice(from, 1);

  // Après suppression, la longueur a diminué d'1.
  // On clamp `to` sur la nouvelle plage d'indices d'insertion [0..next.length].
  const safeTo = clampIndex(to, 0, next.length);

  next.splice(safeTo, 0, item);
  return next;
}
