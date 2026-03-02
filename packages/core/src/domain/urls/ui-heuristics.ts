/**
 * @file packages/core/src/domain/urls/ui-heuristics.ts
 * @layer core/domain/urls
 * @description
 * Heuristiques UI-only pour la saisie de liens.
 * ⚠️ Ne remplace pas les validations de format/sécurité (Zod + domaine).
 */

/** Vrai si la valeur ressemble à un préfixe http(s) incomplet. */
export function isHttpPrefixOnly(href: string): boolean {
  const v = (href ?? "").trim().toLowerCase();
  return (
    v === "http" ||
    v === "https" ||
    v === "http:" ||
    v === "https:" ||
    v === "http:/" ||
    v === "https:/" ||
    v === "http://" ||
    v === "https://"
  );
}

/** Vrai si la valeur ressemble à un préfixe mailto incomplet ("mailto:"). */
export function isMailtoPrefixOnly(href: string): boolean {
  return (href ?? "").trim().toLowerCase() === "mailto:";
}
