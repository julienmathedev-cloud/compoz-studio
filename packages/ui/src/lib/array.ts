/**
 * @file packages/ui/src/lib/array.ts
 * @layer lib
 *
 * @description
 * Helpers immuables pour manipuler des tableaux (UI-friendly).
 * - Aucun effet de bord.
 * - Retourne toujours une nouvelle instance.
 */

function isValidIndex(length: number, index: number) {
  return index >= 0 && index < length;
}

export function setAt<T>(arr: ReadonlyArray<T>, index: number, value: T): T[] {
  if (!isValidIndex(arr.length, index)) return Array.from(arr);

  const next = Array.from(arr);
  next[index] = value;
  return next;
}

export function removeAt<T>(arr: ReadonlyArray<T>, index: number): T[] {
  const next = Array.from(arr);
  next.splice(index, 1);
  return next;
}

export function insertAt<T>(
  arr: ReadonlyArray<T>,
  index: number,
  value: T,
): T[] {
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
  const item = next[from];
  if (!isValidIndex(next.length, from)) return next;

  next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
