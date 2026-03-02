/**
 * @file packages/ui/src/lib/links/helpers.ts
 * @layer lib/links
 * @description
 * Helpers **purs** de gestion des liens (href, sécurité, active link), sans UI ni dépendance Next.
 * Utilisés par les composants publics, l’admin (preview) et le rendu du site publié.
 *
 * Invariants sécurité :
 * - Refuse les schémas dangereux (`javascript:`, `vbscript:`, `data:`, `file:`, `about:`, `chrome:`)
 *   y compris sous forme obfusquée/encodée (ex. `javascript%3A`).
 * - `mailto:` et `tel:` sont externes mais “spéciaux” (traitement dédié).
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type UnsafeReason =
  | "javascript"
  | "vbscript"
  | "data"
  | "file"
  | "about"
  | "chrome"
  | "encoded";

export type LinkFlags = Readonly<{
  /** Externe “brut” (override possible). */
  rawExternal: boolean;
  /** Protocole spécial (mailto/tel). */
  special: boolean;
  /** Externe “classique” http(s) (donc rawExternal && !special). */
  external: boolean;
  /** Href interdit (schéma dangereux). */
  unsafe: boolean;
  /** Raison de blocage (si unsafe). */
  unsafeReason?: UnsafeReason;
}>;

/* -------------------------------------------------------------------------- */
/*                          External / Special detection                       */
/* -------------------------------------------------------------------------- */

/**
 * Vrai si `href` est une URL http(s) **absolue** (avec protocole ou protocole relatif `//`).
 */
export function isAbsoluteUrl(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

/** @internal Protocoles “spéciaux” (non http) considérés comme externes. */
const SPECIAL_PROTOCOLS = ["mailto:", "tel:"] as const;

/** @internal Schémas explicitement interdits dans un `href`. */
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

/**
 * Vrai si `href` commence par un protocole spécial (ex. `mailto:` ou `tel:`).
 */
export function isSpecialProtocol(
  href?: string | null,
  list: readonly string[] = SPECIAL_PROTOCOLS,
): boolean {
  if (typeof href !== "string") return false;
  const lower = href.toLowerCase();
  return list.some((p) => lower.startsWith(p));
}

/* -------------------------------------------------------------------------- */
/*                                Path / Active                               */
/* -------------------------------------------------------------------------- */

/**
 * Fabrique un slug simple à partir d’un libellé (usage UI).
 */
export function slugifyPath(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents
    .replace(/[^a-z0-9]+/g, "-") // espaces/ponctuation -> "-"
    .replace(/^-+|-+$/g, ""); // trim "-"
}

/**
 * Normaliser un chemin d’URL pour comparaison fiable.
 * - Extrait `pathname` si URL absolue
 * - Retire le slash final (sauf racine "/")
 */
export function normalizePath(path: string): string {
  try {
    const url = new URL(path, "http://dummy");
    let pathname = url.pathname;

    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  } catch {
    let p = path || "/";
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1) p = p.replace(/\/+$/, "");
    return p;
  }
}

/**
 * Déterminer si un lien est **actif** selon le chemin courant.
 */
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

/* -------------------------------------------------------------------------- */
/*                              Unsafe href detection                          */
/* -------------------------------------------------------------------------- */

/**
 * Normalise un href pour la détection de schémas dangereux.
 *
 * Objectif : neutraliser les préfixes “invisibles” et obfuscations triviales
 * (espaces/contrôles), sans essayer de “réparer” l’URL.
 */
function normalizeUnsafeCandidate(href: string): string {
  // 1) strip contrôles + espaces au début (classique)
  const leadingStripped = href.replace(/^[\s\u0000-\u001F]+/, "");

  // 2) lowercase (case-insensitive)
  const lower = leadingStripped.toLowerCase();

  // 3) version “collapsée” : retire contrôles/espaces partout.
  //    Permet de détecter `java\u0000script:` ou `java script:`.
  return lower.replace(/[\s\u0000-\u001F]+/g, "");
}

/**
 * Détecter les **protocoles non sûrs** pour `<a href=...>` (XSS, schémas interdits).
 */
export function isUnsafeHref(href?: string | null): UnsafeHrefResult {
  if (typeof href !== "string") return { unsafe: false };

  const cleaned = normalizeUnsafeCandidate(href);

  // 1) Schéma explicite (ex: "javascript:").
  for (const proto of UNSAFE_PROTOCOLS) {
    if (cleaned.startsWith(`${proto}:`)) {
      return { unsafe: true, reason: proto };
    }
  }

  // 2) Encodages courants du ":" après protocole (ex: "javascript%3A", "javascript&#58;")
  // Politique stricte : si ça ressemble à un protocole dangereux encodé → on bloque.
  const encodedProtoRe = new RegExp(
    `^(${UNSAFE_PROTOCOLS.join("|")})(%3a|&#58;|&#x3a;)`,
  );
  if (encodedProtoRe.test(cleaned)) {
    return { unsafe: true, reason: "encoded" };
  }

  return { unsafe: false };
}

/* -------------------------------------------------------------------------- */
/*                                 Main resolver                              */
/* -------------------------------------------------------------------------- */

/**
 * Résoudre les **flags de lien** (externe, spécial, non sûr…).
 *
 * @param href Href à analyser (idéalement déjà normalisé via `normalizeString`)
 */
export function resolveLinkFlags(href: string): LinkFlags {
  const { unsafe, reason } = isUnsafeHref(href);

  // External “brut” = URL absolue http(s) OU protocole spécial (mailto/tel)
  const special = isSpecialProtocol(href);
  const rawExternal = isAbsoluteUrl(href) || special;

  // External “classique” = rawExternal mais pas special
  const external = rawExternal && !special;

  return {
    rawExternal,
    special,
    external,
    unsafe,
    unsafeReason: reason,
  };
}

/**
 * Détecte si l'on est en mode preview admin.
 * Basé sur la présence de "/preview" dans le pathname.
 */
export function isPreviewPath(path: string): boolean {
  const current = normalizePath(path);
  return current === "/preview" || current.startsWith("/preview/");
}

export function shouldDisableLinksInPreview(currentPath: string): boolean {
  return isPreviewPath(currentPath);
}
export type PublicMountBase = "/preview" | "/draft" | "/site" | "/";

/**
 * Résout la base de mount public selon le chemin courant.
 * - /preview/* => /preview
 * - /draft/*   => /draft
 * - /site/*    => /site
 * - sinon      => /
 */
export function resolvePublicMountBase(currentPath: string): PublicMountBase {
  const p = normalizePath(currentPath || "/");

  if (p === "/preview" || p.startsWith("/preview/")) return "/preview";
  if (p === "/draft" || p.startsWith("/draft/")) return "/draft";
  if (p === "/site" || p.startsWith("/site/")) return "/site";

  return "/";
}

/**
 * Préfixe un href interne (commençant par "/") avec la base de mount.
 *
 * Exemples:
 * - current="/site/abc", href="/contact" => "/site/contact"
 * - current="/draft", href="/" => "/draft"
 * - current="/", href="/contact" => "/contact"
 *
 * Invariants:
 * - ne modifie pas les href externes/specials/unsafe
 * - évite le double préfixe
 */
export function resolveInternalHref(currentPath: string, href: string): string {
  const raw = String(href ?? "").trim();
  if (!raw) return raw;

  const flags = resolveLinkFlags(raw);
  if (flags.rawExternal || flags.unsafe) return raw; // ✅ suffit

  if (!raw.startsWith("/")) return raw;

  const base = resolvePublicMountBase(currentPath);
  if (base === "/") return normalizePath(raw);

  const target = normalizePath(raw);

  if (target === "/") return base;
  if (target === base || target.startsWith(base + "/")) return target;

  return base + target;
}
