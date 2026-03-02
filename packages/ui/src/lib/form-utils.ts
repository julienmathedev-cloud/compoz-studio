/**
 * @file packages/ui/src/lib/form-utils.ts
 * @layer ui-mapper
 * @description
 * Helpers UI partagés pour les mappers : trimming, coercition, conversion de draft/form.
 */

/** Trim basique conservant la chaîne vide (UI friendly). */
export const trimKeepEmpty = (s: string | null | undefined): string =>
  typeof s === "string" ? s.trim() : "";

/** Coercition booléenne défensive. */
export const asBool = (v: unknown): boolean => Boolean(v);

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
