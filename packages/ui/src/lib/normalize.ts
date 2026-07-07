/**
 * @file packages/ui/src/lib/normalize.ts
 * @layer ui/lib/normalize
 * @description UI-only normalization helpers for admin inputs, link drafts, and visible text.
 * @remarks
 * These are ergonomic transformations only; link security validation belongs to the link helpers.
 */

import { isHttpPrefixOnly } from "@compoz/core/domain/urls/ui-heuristics";

const HTTPS = "https://";

function hasScheme(s: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*:/i.test((s ?? "").trim());
}

function looksLikeAbsoluteHttp(s: string): boolean {
  return /^https?:\/\//i.test((s ?? "").trim());
}

function looksLikeHashAnchor(s: string): boolean {
  const v = (s ?? "").trim();
  return v.startsWith("#") || v.startsWith("/#");
}

function looksLikeSpecialHref(s: string): boolean {
  return /^(mailto|tel):/i.test((s ?? "").trim());
}

/** Normalizes internal `/home` aliases to `/` while preserving query and hash. */
function normalizeHomeAlias(path: string): string {
  const p = (path ?? "").trim();
  if (!p) return "/";

  const withLeading = p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;

  const match = withLeading.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const pathname = match?.[1] ?? withLeading;
  const search = match?.[2] ?? "";
  const hash = match?.[3] ?? "";

  // `/home` is an editor-friendly alias for the public root path.
  if (pathname === "/home" || pathname === "/home/") {
    return `/${search}${hash}`.replace(/^\/\?/, "/?").replace(/^\/#/, "/#");
  }

  return `${pathname}${search}${hash}` || "/";
}

/** Converts free-form admin input to an external HTTPS link draft. */
export function toExternalDraft(raw: string): string {
  let v = (raw ?? "").trim();

  if (!v || isHttpPrefixOnly(v)) return HTTPS;
  if (v.startsWith("/")) return HTTPS;
  if (looksLikeSpecialHref(v)) return v;

  // Non-HTTP schemes are stripped before rebasing to HTTPS.
  if (!looksLikeAbsoluteHttp(v) && hasScheme(v)) {
    v = v.replace(/^[A-Za-z][A-Za-z0-9+.-]*:/, "");
  }

  v = v.replace(/^(https?:\/\/+)+/i, "").replace(/^\/+/, "");

  return `${HTTPS}${v}`;
}

/** Converts free-form admin input to an internal root-relative link draft. */
export function toInternalDraft(raw: string): string {
  const v = (raw ?? "").trim();

  if (!v || isHttpPrefixOnly(v)) return "/";

  // Local anchors are already valid internal href drafts.
  if (looksLikeHashAnchor(v)) {
    return v;
  }

  if (looksLikeAbsoluteHttp(v)) {
    try {
      const u = new URL(v);
      const out = (u.pathname || "/") + (u.search || "") + (u.hash || "");
      return normalizeHomeAlias(out || "/");
    } catch {
      // Best-effort fallback: strip the host when URL parsing fails.
      const stripped = v.replace(/^https?:\/\/[^/]+/i, "");
      if (!stripped || isHttpPrefixOnly(stripped)) return "/";

      const out = stripped.startsWith("/")
        ? stripped
        : `/${stripped.replace(/^\/+/, "")}`;

      return normalizeHomeAlias(out || "/");
    }
  }

  const out = v.startsWith("/") ? v || "/" : `/${v.replace(/^\/+/, "")}`;
  return normalizeHomeAlias(out || "/");
}

export function normalizeTelAndMailtoHrefDraft(value: string): string | null {
  const raw = (value ?? "").trim();
  const normalized = raw
    .replace(/^\/(?=(mailto|tel):)/i, "")
    .replace(/^https?:\/\/(?=(mailto|tel):)/i, "");

  return /^(mailto|tel):/i.test(normalized) ? normalized : null;
}

export function normalizeArray<T>(input: unknown, filterFalsy = true): T[] {
  const arr: T[] = Array.isArray(input)
    ? (input as T[])
    : input == null
      ? []
      : ([input] as T[]);

  return filterFalsy ? arr.filter(Boolean) : arr;
}

export function normalizeString(str: unknown, fallback = ""): string {
  if (typeof str === "string") return str.trim();
  if (typeof str === "number") return String(str);
  return fallback;
}

export function normalizeVisibleText(input: string): string {
  return normalizeString(input).replace(/\s+/g, " ");
}
