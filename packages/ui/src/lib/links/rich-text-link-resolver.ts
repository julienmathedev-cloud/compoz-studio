/**
 * @file packages/ui/src/lib/links/rich-text-link-resolver.ts
 * @layer ui/lib/links
 * @description Resolves Rich Text hrefs from shared link primitives without depending on HTML or renderers.
 * @remarks
 * Keeps physical route mounts separate from logical site paths for public, fallback, draft, and preview rendering.
 */

import {
  normalizePath,
  resolveInternalHref,
  resolveLinkFlags,
  resolveSiteMountBase,
  shouldDisableLinksInPreview,
  type UnsafeReason,
} from "@compoz/ui/lib/links/helpers";

export type SiteLinkBase = Readonly<{
  origin: string;
  mountBase: string;
}>;

export type RichTextLinkContext = Readonly<{
  currentPath: string;
  internalBases: ReadonlyArray<SiteLinkBase>;
}>;

export type ResolvedRichTextLink =
  | Readonly<{ kind: "internal"; href: string }>
  | Readonly<{ kind: "external"; href: string }>
  | Readonly<{ kind: "native"; href: string }>
  | Readonly<{ kind: "disabled" }>
  | Readonly<{ kind: "unsafe"; reason?: UnsafeReason }>;

type NormalizedSiteLinkBase = Readonly<{
  origin: string;
  mountBase: string;
}>;

function normalizeSiteLinkBase(
  base: SiteLinkBase,
): NormalizedSiteLinkBase | null {
  try {
    const origin = new URL(base.origin);

    if (origin.protocol !== "http:" && origin.protocol !== "https:") {
      return null;
    }

    return {
      origin: origin.origin,
      mountBase: normalizePath(base.mountBase || "/"),
    };
  } catch {
    return null;
  }
}

function normalizeInternalBases(
  bases: ReadonlyArray<SiteLinkBase>,
): ReadonlyArray<NormalizedSiteLinkBase> {
  return bases
    .map(normalizeSiteLinkBase)
    .filter((base): base is NormalizedSiteLinkBase => base !== null)
    .sort((left, right) => right.mountBase.length - left.mountBase.length);
}

function isPathWithinMount(pathname: string, mountBase: string): boolean {
  return (
    mountBase === "/" ||
    pathname === mountBase ||
    pathname.startsWith(`${mountBase}/`)
  );
}

function toLogicalPath(pathname: string, mountBase: string): string {
  if (mountBase === "/") {
    return pathname || "/";
  }

  const remaining = pathname.slice(mountBase.length);
  return remaining || "/";
}

function resolveRelativeInternalHref(
  currentPath: string,
  href: string,
): string {
  const currentMount = resolveSiteMountBase(currentPath);
  const physicalPath = normalizePath(currentPath);
  const logicalCurrentPath =
    currentMount === "/"
      ? physicalPath
      : physicalPath.startsWith(currentMount)
        ? physicalPath.slice(currentMount.length) || "/"
        : "/";

  const resolved = new URL(href, `https://compoz.invalid${logicalCurrentPath}`);
  const logicalHref = `${resolved.pathname}${resolved.search}${resolved.hash}`;

  return resolveInternalHref(currentPath, logicalHref);
}

function parseHttpUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/** Resolves a Rich Text href against the logical site currently being rendered. */
export function resolveRichTextLink(args: {
  href: string;
  context: RichTextLinkContext;
}): ResolvedRichTextLink {
  const href = String(args.href ?? "").trim();

  if (!href) {
    return { kind: "unsafe" };
  }

  const flags = resolveLinkFlags(href);

  if (flags.unsafe) {
    return { kind: "unsafe", reason: flags.unsafeReason };
  }

  if (href.startsWith("#")) {
    return { kind: "native", href };
  }

  if (shouldDisableLinksInPreview(args.context.currentPath)) {
    return { kind: "disabled" };
  }

  if (href.startsWith("?") || flags.special) {
    return { kind: "native", href };
  }

  if (!flags.rawExternal) {
    const resolved = href.startsWith("/")
      ? resolveInternalHref(args.context.currentPath, href)
      : resolveRelativeInternalHref(args.context.currentPath, href);

    return { kind: "internal", href: resolved };
  }

  const bases = normalizeInternalBases(args.context.internalBases);
  const parsed = parseHttpUrl(href);

  if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
    return { kind: "unsafe" };
  }

  const internalBase = bases.find(
    (base) =>
      parsed.origin === base.origin &&
      isPathWithinMount(parsed.pathname, base.mountBase),
  );

  if (!internalBase) {
    return { kind: "external", href };
  }

  const logicalPath = toLogicalPath(parsed.pathname, internalBase.mountBase);
  const remounted = resolveInternalHref(
    args.context.currentPath,
    `${logicalPath}${parsed.search}${parsed.hash}`,
  );

  return { kind: "internal", href: remounted };
}
