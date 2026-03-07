/**
 * @file packages/ui/src/lib/form-utils.ts
 * @layer ui/lib/forms
 * @description
 * Helpers UI partagés pour les mappers : trimming, coercition, conversion de draft/form.
 *
 * @remarks
 * Convention PATCH :
 * - `undefined` => clé absente (pas de modification)
 * - `null`      => effacement explicite
 */

/** Trim basique conservant la chaîne vide (UI friendly). */
export const trimKeepEmpty = (s: string | null | undefined): string =>
  typeof s === "string" ? s.trim() : "";

/**
 * Coercition booléenne défensive (UI-friendly).
 *
 * @remarks
 * Gère les cas fréquents :
 * - boolean
 * - "true"/"false" (case-insensitive)
 * - 1/0
 * - sinon fallback `Boolean(v)`
 */
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

/** Chaîne vide -> undefined (utile pour champs optionnels côté shape). */
export const emptyToUndef = (
  s: string | null | undefined,
): string | undefined => {
  const v = trimKeepEmpty(s);
  return v.length > 0 ? v : undefined;
};

/**
 * UI asset (form) -> PATCH DTO
 * - "" => null (effacement explicite)
 * - undefined => clé absente
 */
export const assetUiToPatch = (
  s: string | null | undefined,
): string | null | undefined => {
  if (s === undefined) return undefined;
  const v = trimKeepEmpty(s);
  return v.length > 0 ? v : null;
};

/**
 * UI asset (form) -> Settings shape (preview/public)
 * - "" devient null
 */
export const assetUiToSettings = (
  s: string | null | undefined,
): string | null => {
  const v = trimKeepEmpty(s);
  return v.length > 0 ? v : null;
};
