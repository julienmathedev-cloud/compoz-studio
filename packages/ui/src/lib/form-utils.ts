/**
 * @file packages/ui/src/lib/form-utils.ts
 * @layer ui/lib/forms
 * @description Shared UI form helpers for trimming, coercion, and draft/form mapping.
 * @remarks
 * PATCH convention: `undefined` means omitted, while `null` means explicit clearing.
 */

export const trimKeepEmpty = (s: string | null | undefined): string =>
  typeof s === "string" ? s.trim() : "";

/** Defensive UI boolean coercion for common form values. */
export const asBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;

  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "1") return true;
    if (s === "0") return false;
  }

  if (typeof v === "number") {
    if (v === 1) return true;
    if (v === 0) return false;
  }

  return Boolean(v);
};

/** Maps asset form values to PATCH semantics. */
export const assetUiToPatch = (
  s: string | null | undefined,
): string | null | undefined => {
  if (s === undefined) return undefined;
  const v = trimKeepEmpty(s);
  return v.length > 0 ? v : null;
};

export const assetUiToSettings = (
  s: string | null | undefined,
): string | null => {
  const v = trimKeepEmpty(s);
  return v.length > 0 ? v : null;
};
