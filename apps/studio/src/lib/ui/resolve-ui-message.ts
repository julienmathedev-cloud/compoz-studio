/**
 * @file apps/studio/src/lib/ui/resolve-ui-message.ts
 * @layer studio/lib/ui
 *
 * @description
 * Helpers purs de résolution de messages UI à partir d’un token.
 *
 * Contrat token :
 * - UI tokens : `uiErrors.<token>` (camelCase)
 * - Domain tokens : `errors.<CODE>` (MAJUSCULE_SNAKE_CASE)
 *
 * @remarks
 * - Aucun side-effect (pas de toast, pas de state global).
 * - Utilisé par `notify` + composants UI (ex: `ErrorText`).
 */

export type ResolveKey = (key: string) => string;

/**
 * Détecte un token UI (camelCase), ex: `networkError`.
 */
export function isUiToken(input: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(input);
}

/**
 * Détecte un token domaine (MAJUSCULE_SNAKE_CASE), ex: `SLUG_REQUIRED`.
 */
export function isDomainToken(input: string): boolean {
  return /^[A-Z0-9_]+$/.test(input);
}

/**
 * Détecte un token "semblable" (UI ou domaine).
 */
export function isTokenLike(input: string): boolean {
  return isUiToken(input) || isDomainToken(input);
}

/**
 * Résout un message à partir d’un input :
 * - si token → `uiErrors.<token>` ou `errors.<CODE>`
 * - sinon → retourne l’input tel quel (déjà humain)
 *
 * @remarks
 * - Le resolver est responsable du fallback (`default`, etc.).
 */
export function resolveMessage(input: string, resolve?: ResolveKey): string {
  if (!resolve) return input;

  if (!isTokenLike(input)) return input;

  const key = isUiToken(input) ? `uiErrors.${input}` : `errors.${input}`;
  const out = resolve(key);

  return out && out !== key ? out : input;
}
