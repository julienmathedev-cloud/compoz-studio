/**
 * @file apps/studio/src/lib/ui/resolve-ui-message.ts
 * @layer studio/lib/ui
 *
 * @description
 * Pure helpers for resolving UI messages from error tokens.
 *
 * @remarks
 * - UI tokens resolve through `uiErrors.<token>`.
 * - Domain tokens resolve through `errors.<CODE>`.
 * - Has no side effects: no toast, no state, and no global resolver.
 * - Used by `notify` and UI components such as `ErrorText`.
 */

export type ResolveKey = (key: string) => string;

export function isUiToken(input: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(input);
}

export function isDomainToken(input: string): boolean {
  return /^[A-Z0-9_]+$/.test(input);
}

export function isTokenLike(input: string): boolean {
  return isUiToken(input) || isDomainToken(input);
}

/**
 * Resolves token-like inputs through the provided i18n resolver.
 *
 * @remarks
 * - Non-token inputs are treated as already human-readable and returned as-is.
 * - If the resolver cannot translate the generated key, the original input is returned.
 */
export function resolveMessage(input: string, resolve?: ResolveKey): string {
  if (!resolve) return input;

  if (!isTokenLike(input)) return input;

  const key = isUiToken(input) ? `uiErrors.${input}` : `errors.${input}`;
  const out = resolve(key);

  return out && out !== key ? out : input;
}
