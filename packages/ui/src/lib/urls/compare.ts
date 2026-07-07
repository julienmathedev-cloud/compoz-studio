/**
 * @file packages/ui/src/lib/urls/compare.ts
 * @layer ui/lib/urls
 * @description Stable comparison keys for href and label deduplication.
 * @remarks
 * Comparison-only normalization: never use these keys as canonical persisted URLs.
 */

import { isAbsoluteHttpProtocol } from "@compoz/core/domain/urls/guards";
import { parseMailto } from "@compoz/core/domain/urls/mailto";

function normalizeRelativePath(input: string): string {
  let p = (input ?? "").trim();
  if (!p) return "";

  if (p.startsWith("#") || p.startsWith("?")) return p;

  if (!p.startsWith("/")) p = `/${p}`;

  p = p.replace(/\/{2,}/g, "/");

  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  return p;
}

function normalizeSpecialProtocol(href: string): string {
  const s = (href ?? "").trim();
  const i = s.indexOf(":");
  if (i <= 0) return s;

  const proto = s.slice(0, i).toLowerCase();
  const rest = s.slice(i + 1);
  return `${proto}:${rest}`;
}

export function sortSearchParams(raw: string): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  const normalized = input.startsWith("?") ? input.slice(1) : input;

  const params = new URLSearchParams(normalized);
  const ordered = new URLSearchParams();

  const keys = Array.from(new Set(Array.from(params.keys()))).sort();
  keys.forEach((k) => {
    const vals = params.getAll(k);
    vals.sort();
    vals.forEach((v) => ordered.append(k, v));
  });

  const out = ordered.toString();
  return out ? `?${out}` : "";
}

function normalizeHttpLike(href: string): string | null {
  try {
    const raw = href.startsWith("//") ? `https:${href}` : href;

    const u = new URL(raw);
    if (!isAbsoluteHttpProtocol(u.protocol)) return null;

    const protocol = u.protocol.toLowerCase();
    const host = u.hostname.toLowerCase();

    const isDefaultPort =
      (protocol === "http:" && (u.port === "" || u.port === "80")) ||
      (protocol === "https:" && (u.port === "" || u.port === "443"));

    let path = u.pathname.replace(/\/{2,}/g, "/");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    const search = sortSearchParams(u.search);
    const hash = u.hash;
    return `${protocol}//${host}${
      isDefaultPort ? "" : `:${u.port}`
    }${path}${search}${hash}`;
  } catch {
    return null;
  }
}

function normalizeMailto(href: string): string | null {
  const parsed = parseMailto(href);
  if (!parsed) return null;

  const to = Array.from(
    new Set(parsed.recipients.map((r) => r.toLowerCase())),
  ).sort();

  const params = new URLSearchParams();
  Array.from(new Set(Array.from(parsed.params.keys()).sort())).forEach((k) => {
    const vals = parsed.params.getAll(k);
    vals.sort();
    vals.forEach((v) => params.append(k, v));
  });

  const q = params.toString();
  return `mailto:${to.join(",")}${q ? `?${q}` : ""}`;
}

export function hrefCompareKey(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";

  if (s.startsWith("//")) {
    return normalizeHttpLike(s) ?? s;
  }

  const i = s.indexOf(":");

  if (i > 0) {
    const proto = s.slice(0, i + 1).toLowerCase();

    if (proto === "mailto:") return normalizeMailto(s) ?? s;

    if (proto === "tel:") return normalizeSpecialProtocol(s);

    const http = normalizeHttpLike(s);
    if (http) return http;
  }

  return normalizeRelativePath(s);
}

export function labelCompareKey(label: string): string {
  return (label ?? "").trim().toLowerCase();
}
