/**
 * @file apps/studio/src/lib/strings.ts
 * @layer app/studio/lib
 * @description
 * Helpers de trimming pour adapters studio (UI/admin).
 */

/**
 * Trim qui ne transforme pas une chaîne "blanche" en "" :
 * si trim() donne "", on conserve la valeur d'origine.
 */
export const trimOrKeep = (v: string): string => {
  const t = v.trim();
  return t.length === 0 ? v : t;
};

/**
 * Trim une string clearable :
 * - null | undefined => undefined
 * - "" => undefined
 * - " x " => "x"
 */
export const trimClearableOrUndef = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
};
