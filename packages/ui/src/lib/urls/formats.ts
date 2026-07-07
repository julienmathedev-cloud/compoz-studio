/**
 * @file packages/ui/src/lib/urls/formats.ts
 * @layer ui/lib/urls
 * @description String-only URL formatting helpers for trailing slash removal and base/path composition.
 * @remarks
 * Minimal formatting only: no validation, no advanced parsing, and no SEO canonicalization.
 */

export function stripTrailingSlashes(u: string): string;
export function stripTrailingSlashes(u?: string): string | undefined;
export function stripTrailingSlashes(u?: string): string | undefined {
  if (u == null) return undefined;
  if (u === "/") return "/";

  // Keep whitespace untouched: this low-level formatter only removes trailing slashes.
  return u.replace(/\/+$/, "");
}

export function canonicalFromBase(
  base: string | undefined,
  path: string,
): string | undefined {
  const b = stripTrailingSlashes(base);
  if (!b) return undefined;

  const rawPath = (path ?? "").trim();
  if (!rawPath || rawPath === "/") return b;

  const p = rawPath.replace(/^\/+/, "");
  return `${b}/${p}`;
}
