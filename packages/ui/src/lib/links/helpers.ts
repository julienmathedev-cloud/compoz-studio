/**
 * @file packages/ui/src/lib/links/helpers.ts
 * @layer ui/lib/links
 * @description Pure link helpers for href safety, active link checks, and mount-aware internal URLs.
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
  | "encoded";

export type LinkFlags = Readonly<{
  rawExternal: boolean;
  special: boolean;
  external: boolean;
  unsafe: boolean;
  unsafeReason?: UnsafeReason;
}>;

function isAbsoluteUrl(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

/** Non-http protocols that are still treated as external links. */
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

type UnsafeHrefResult = Readonly<{
  unsafe: boolean;
  reason?: UnsafeReason;
}>;

function isSpecialProtocol(
  href?: string | null,
  list: readonly string[] = SPECIAL_PROTOCOLS,
): boolean {
  if (typeof href !== "string") {
    return false;
  }

  const lower = href.toLowerCase();

  return list.some((protocol) => lower.startsWith(protocol));
}

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
      normalized = "/" + normalized;
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
    : current === target || current.startsWith(target + "/");
}

/** Removes leading controls and trivial whitespace obfuscation before unsafe-scheme checks. */
function normalizeUnsafeCandidate(href: string): string {
  const leadingStripped = href.replace(/^[\s\u0000-\u001F]+/, "");
  const lower = leadingStripped.toLowerCase();

  return lower.replace(/[\s\u0000-\u001F]+/g, "");
}

function isUnsafeHref(href?: string | null): UnsafeHrefResult {
  if (typeof href !== "string") {
    return { unsafe: false };
  }

  const cleaned = normalizeUnsafeCandidate(href);

  for (const protocol of UNSAFE_PROTOCOLS) {
    if (cleaned.startsWith(`${protocol}:`)) {
      return { unsafe: true, reason: protocol };
    }
  }

  const encodedProtoRe = new RegExp(
    `^(${UNSAFE_PROTOCOLS.join("|")})(%3a|&#58;|&#x3a;)`,
  );

  if (encodedProtoRe.test(cleaned)) {
    return { unsafe: true, reason: "encoded" };
  }

  return { unsafe: false };
}

export function resolveLinkFlags(href: string): LinkFlags {
  const raw = String(href ?? "").trim();
  const { unsafe, reason } = isUnsafeHref(raw);

  const special = isSpecialProtocol(raw);
  const rawExternal = isAbsoluteUrl(raw) || special;
  const external = rawExternal && !special;

  return {
    rawExternal,
    special,
    external,
    unsafe,
    unsafeReason: reason,
  };
}

function isMountPath(path: string, mount: string): boolean {
  return path === mount || path.startsWith(mount + "/");
}

function isPreviewPath(path: string): boolean {
  const current = normalizePath(path);

  return isMountPath(current, "/preview");
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
  return isPreviewPath(currentPath);
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

/** Prefixes safe root-relative internal hrefs with the active site mount base without double-prefixing. */
export function resolveInternalHref(currentPath: string, href: string): string {
  const raw = String(href ?? "").trim();

  if (!raw) {
    return raw;
  }

  const flags = resolveLinkFlags(raw);

  if (flags.rawExternal || flags.unsafe) {
    return raw;
  }

  if (!raw.startsWith("/")) {
    return raw;
  }

  const url = new URL(raw, "http://dummy");
  const suffix = `${url.search}${url.hash}`;
  const base = resolveSiteMountBase(currentPath);

  if (base === "/") {
    return `${normalizePath(raw)}${suffix}`;
  }

  const target = normalizePath(raw);

  if (target === "/") {
    return `${base}${suffix}`;
  }

  if (target === base || target.startsWith(base + "/")) {
    return `${target}${suffix}`;
  }

  return `${base}${target}${suffix}`;
}
