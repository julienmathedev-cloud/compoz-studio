/**
 * @file packages/ui/src/lib/array.ts
 * @layer ui/lib/array
 * @description Immutable array helpers for UI state updates.
 * @remarks
 * Out-of-bounds operations return a shallow copy unchanged; `moveItem` clamps the target insertion index after removal.
 */

function isValidIndex(length: number, index: number): boolean {
  return index >= 0 && index < length;
}

function clampIndex(index: number, min: number, max: number): number {
  return Math.min(Math.max(index, min), max);
}

export function insertAt<T>(
  arr: ReadonlyArray<T>,
  index: number,
  value: T,
): T[] {
  // `index === length` is allowed to append; other out-of-bounds indexes are ignored.
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

  // Clamp after removal because insertion indexes now range from 0 to `next.length`.
  const safeTo = clampIndex(to, 0, next.length);

  next.splice(safeTo, 0, item);
  return next;
}
