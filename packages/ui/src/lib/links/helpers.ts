/**
 * @file packages/ui/src/lib/links/helpers.ts
 * @layer ui/lib/links
 * @description Pure shared link helpers for href safety, path checks, and mount-aware internal URLs.
 * @remarks
 * Rejects dangerous schemes even when trivially obfuscated or encoded; no UI or Next.js dependency belongs here.
 */

import { SITE_PATH, STUDIO_PATH } from "@compoz/core/constants/web/paths";

export type UnsafeReason =
  | "javascript"
  | "vbscript"
  | "data"
  | "file"
  | "about"
  | "chrome"
  | "unknown-protocol"
  | "invalid-http-url"
  | "invalid-protocol"
  | "encoded"
  | "unsupported-network-reference";

export type LinkFlags = Readonly<{
  rawExternal: boolean;
  special: boolean;
  external: boolean;
  unsafe: boolean;
  unsafeReason?: UnsafeReason;
}>;

/** Non-http protocols that retain their native browser behavior. */
const SPECIAL_PROTOCOLS = ["mailto:", "tel:"] as const;

/** Schemes forbidden in rendered href attributes. */
const UNSAFE_PROTOCOLS = [
  "javascript",
  "vbscript",
  "data",
  "file",
  "about",
  "chrome",
] as const;

const ENCODED_UNSAFE_PROTOCOL_PATTERN = new RegExp(
  `^(${UNSAFE_PROTOCOLS.join("|")})(%3a|&#58;|&#x3a;)`,
);

export function slugifyPath(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalizes URL paths for reliable active-link comparisons. */
export function normalizePath(path: string): string {
  try {
    const url = new URL(path, "http://dummy");
    let pathname = url.pathname;

    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    return pathname;
  } catch {
    let normalized = path || "/";

    if (!normalized.startsWith("/")) {
      normalized = `/${normalized}`;
    }

    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/, "");
    }

    return normalized;
  }
}

export function isActiveLink(
  currentPath: string,
  targetPath: string,
  mode: "exact" | "startsWith" = "exact",
): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(targetPath);

  return mode === "exact"
    ? current === target
    : current === target || current.startsWith(`${target}/`);
}

/**
 * Removes controls and trivial whitespace obfuscation before unsafe-scheme
 * checks. This normalization must only be used to reject candidates, never
 * to positively recognize an allowed protocol.
 */
function normalizeUnsafeCandidate(href: string): string {
  const leadingStripped = href.replace(/^[\s\u0000-\u001F]+/, "");

  return leadingStripped.toLowerCase().replace(/[\s\u0000-\u001F]+/g, "");
}

/** Recognizes only a syntactically valid protocol at the start of the href. */
function getStrictExplicitProtocol(href: string): string | null {
  return /^([a-z][a-z\d+.-]*:)/i.exec(href.trim())?.[1].toLowerCase() ?? null;
}

function isSpecialProtocol(protocol: string | null): boolean {
  return (
    protocol !== null &&
    SPECIAL_PROTOCOLS.includes(protocol as (typeof SPECIAL_PROTOCOLS)[number])
  );
}

/** Protocol-relative and backslash network references are intentionally unsupported. */
function isUnsupportedNetworkPathReference(href: string): boolean {
  return /^[\\/]{2}/.test(href);
}

/**
 * Validates both the explicit HTTP(S) syntax and the resulting parsed URL.
 *
 * `new URL()` alone is intentionally insufficient because it repairs several
 * malformed variants such as `https:example.com` or `https:/example.com`.
 */
function isStrictHttpUrl(href: string): boolean {
  const trimmed = href.trim();

  if (
    trimmed.includes("\\") ||
    !/^https?:\/\/[^\s/?#\\]+(?:[/?#]|$)/i.test(trimmed)
  ) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Detects a protocol-like value that becomes recognizable only after removing
 * trivial whitespace or control-character obfuscation.
 */
function hasMalformedProtocolPrefix(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(normalizeUnsafeCandidate(href));
}

function getUnsafeReason(
  href: string,
  protocol: string | null,
): UnsafeReason | undefined {
  const trimmed = href.trim();

  if (isUnsupportedNetworkPathReference(trimmed)) {
    return "unsupported-network-reference";
  }

  const cleaned = normalizeUnsafeCandidate(href);

  for (const unsafeProtocol of UNSAFE_PROTOCOLS) {
    if (cleaned.startsWith(`${unsafeProtocol}:`)) {
      return unsafeProtocol;
    }
  }

  if (ENCODED_UNSAFE_PROTOCOL_PATTERN.test(cleaned)) {
    return "encoded";
  }

  if (
    (protocol === "http:" || protocol === "https:") &&
    !isStrictHttpUrl(href)
  ) {
    return "invalid-http-url";
  }

  if (protocol === null && hasMalformedProtocolPrefix(href)) {
    return "invalid-protocol";
  }

  if (
    protocol !== null &&
    protocol !== "http:" &&
    protocol !== "https:" &&
    !isSpecialProtocol(protocol)
  ) {
    return "unknown-protocol";
  }

  return undefined;
}

export function resolveLinkFlags(href: string): LinkFlags {
  const raw = String(href ?? "").trim();
  const protocol = getStrictExplicitProtocol(raw);
  const unsafeReason = getUnsafeReason(raw, protocol);
  const special = isSpecialProtocol(protocol);
  const rawExternal = protocol === "http:" || protocol === "https:" || special;

  return {
    rawExternal,
    special,
    external: rawExternal && !special,
    unsafe: unsafeReason !== undefined,
    unsafeReason,
  };
}

function isMountPath(path: string, mount: string): boolean {
  return path === mount || path.startsWith(`${mount}/`);
}

function resolveWebsiteSlugMountBase(currentPath: string): string | null {
  const current = normalizePath(currentPath);
  const match = /^\/t\/([^/]+)(?:\/.*)?$/.exec(current);

  if (!match?.[1]) {
    return null;
  }

  return `/t/${match[1]}`;
}

export function shouldDisableLinksInPreview(currentPath: string): boolean {
  return isMountPath(normalizePath(currentPath), STUDIO_PATH.preview);
}

/** Resolves the active site mount base for preview, draft, hosted, and `/t/:websiteSlug` routes. */
export function resolveSiteMountBase(currentPath: string): string {
  const path = normalizePath(currentPath || "/");

  if (isMountPath(path, STUDIO_PATH.preview)) {
    return STUDIO_PATH.preview;
  }

  if (isMountPath(path, STUDIO_PATH.draft)) {
    return STUDIO_PATH.draft;
  }

  const websiteSlugMountBase = resolveWebsiteSlugMountBase(path);

  if (websiteSlugMountBase) {
    return websiteSlugMountBase;
  }

  return SITE_PATH.home;
}

/**
 * Prefixes safe root-relative internal hrefs with the active site mount base
 * without double-prefixing.
 */
export function resolveInternalHref(currentPath: string, href: string): string {
  const raw = String(href ?? "").trim();

  if (!raw) {
    return raw;
  }

  const flags = resolveLinkFlags(raw);

  if (flags.rawExternal || flags.unsafe || !raw.startsWith("/")) {
    return raw;
  }

  const url = new URL(raw, "http://dummy");
  const suffix = `${url.search}${url.hash}`;
  const base = resolveSiteMountBase(currentPath);
  const target = normalizePath(raw);

  if (base === "/") {
    return `${target}${suffix}`;
  }

  if (target === "/") {
    return `${base}${suffix}`;
  }

  if (target === base || target.startsWith(`${base}/`)) {
    return `${target}${suffix}`;
  }

  return `${base}${target}${suffix}`;
}
