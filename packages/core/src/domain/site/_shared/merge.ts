/**
 * @file packages/core/src/domain/site/_shared/merge.ts
 * @layer core/domain/site/_shared
 * @description Shallow merge helpers for controlled patch application.
 * @remarks
 * `undefined` patch values are ignored, and changed keys are detected with `Object.is`.
 */

/** Returns a shallow merged object and the keys whose values actually changed. */
export function shallowMergeWithChangedKeys<T extends object>(
  base: Readonly<T>,
  patch: Readonly<Partial<T>>,
): { next: T; changedKeys: ReadonlyArray<keyof T> } {
  const next: T = { ...base };
  const changedKeys: (keyof T)[] = [];

  for (const k of Object.keys(patch) as (keyof T)[]) {
    const v = patch[k];

    // `undefined` means no change in controlled patch payloads.
    if (v === undefined) continue;

    if (!Object.is(base[k], v)) {
      next[k] = v as T[typeof k];
      changedKeys.push(k);
    }
  }

  return { next, changedKeys };
}
