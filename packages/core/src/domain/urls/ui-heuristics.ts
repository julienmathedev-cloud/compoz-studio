/**
 * @file packages/core/src/domain/urls/ui-heuristics.ts
 * @layer core/domain/urls
 * @description UI-only heuristics for incomplete link inputs.
 * @remarks
 * These helpers do not replace schema or domain format and security validation.
 */

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

export function isMailtoPrefixOnly(href: string): boolean {
  return (href ?? "").trim().toLowerCase() === "mailto:";
}
