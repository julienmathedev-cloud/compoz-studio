/**
 * @file packages/ui/src/lib/build-shallow-diff.ts
 * @layer ui/lib/object
 * @description Builds shallow PATCH payloads by keeping only changed keys from `next`.
 * @remarks
 * Diffing is one-level only and does not represent deletions; only keys present in `next` can be emitted.
 */
export function buildShallowDiff<T extends Record<string, unknown>>(
  prev: Readonly<T>,
  next: Readonly<T>,
): Partial<T> | null {
  const out: Partial<T> = {};
  let changed = false;

  const keys = Object.keys(next) as (keyof T)[];

  for (const k of keys) {
    // `Object.is` preserves JavaScript equality edge cases such as `NaN` and `-0`.
    if (!Object.is(prev[k], next[k])) {
      out[k] = next[k];
      changed = true;
    }
  }

  return changed ? out : null;
}
