/**
 * @file packages/ui/src/hooks/validate/helpers.ts
 * @layer ui/hooks/validate
 * @description Lightweight non-blocking validation helpers for UI checks.
 */

export function hasDuplicates(keys: ReadonlyArray<string>): boolean {
  const seen = new Set<string>();

  for (const k of keys) {
    if (seen.has(k)) return true;
    seen.add(k);
  }

  return false;
}
