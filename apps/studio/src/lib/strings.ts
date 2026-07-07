/**
 * @file apps/studio/src/lib/strings.ts
 * @layer studio/lib
 *
 * @description
 * String normalization helpers used by Studio UI adapters.
 *
 * @remarks
 * - Keeps form normalization centralized while preserving clearable-field semantics.
 */

/** Trims a string unless it contains only whitespace, in which case the original value is preserved. */
export const trimOrKeep = (v: string): string => {
  const t = v.trim();
  return t.length === 0 ? v : t;
};

/** Normalizes clearable string fields to `undefined` when empty or non-string. */
export const trimClearableOrUndef = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;

  const t = v.trim();
  return t.length === 0 ? undefined : t;
};
