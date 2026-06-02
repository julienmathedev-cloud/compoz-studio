/**
 * @file packages/ui/src/lib/normalize.ts
 * @layer ui/lib/normalize
 * @description
 * Normalisations utilitaires pour transformer des saisies admin en brouillons (drafts)
 * cohérents pour liens externes et internes.
 *
 * ⚠️ Heuristiques UI uniquement : pas de validation sécurité.
 * La politique sécurité est centralisée ailleurs (helpers links).
 */

import { isHttpPrefixOnly } from "@compoz/core/domain/urls/ui-heuristics";

const HTTPS = "https://";

/* -------------------------------------------------------------------------- */
/*                               Helpers internes                              */
/* -------------------------------------------------------------------------- */

/**
 * Indique si une chaîne commence par un schéma URI (ex: "http:", "mailto:", "tel:").
 * Heuristique UI : ne remplace pas une validation stricte.
 */
function hasScheme(s: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*:/i.test((s ?? "").trim());
}

/** Vrai si la chaîne ressemble à une URL HTTP(S) absolue (http:// ou https://). */
function looksLikeAbsoluteHttp(s: string): boolean {
  return /^https?:\/\//i.test((s ?? "").trim());
}

/** Vrai si la chaîne est une ancre locale (`#section`). */
function looksLikeHashAnchor(s: string): boolean {
  const v = (s ?? "").trim();
  return v.startsWith("#") || v.startsWith("/#");
}

/**
 * Normalise les alias internes de "home".
 *
 * @remarks
 * - Préserve query/hash.
 * - Tolère "/home" et "/home/".
 */
function normalizeHomeAlias(path: string): string {
  const p = (path ?? "").trim();
  if (!p) return "/";

  // Normalise les slashes initiaux (au moins un)
  const withLeading = p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;

  // Split propre path vs query/hash
  const match = withLeading.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const pathname = match?.[1] ?? withLeading;
  const search = match?.[2] ?? "";
  const hash = match?.[3] ?? "";

  // ✅ Alias home : "/home" ou "/home/" => "/"
  if (pathname === "/home" || pathname === "/home/") {
    return `/${search}${hash}`.replace(/^\/\?/, "/?").replace(/^\/#/, "/#");
  }

  return `${pathname}${search}${hash}` || "/";
}

/* -------------------------------------------------------------------------- */
/*                              External HTTP links                           */
/* -------------------------------------------------------------------------- */

/**
 * Transforme une entrée libre en "brouillon" d’URL externe HTTPS.
 *
 * Comportement :
 * - Vide ou préfixe HTTP incomplet → "https://"
 * - Chemin relatif ("/page") → "https://" (incite à saisir un domaine)
 * - Schéma non-http(s) → suppression du schéma puis rebase en "https://"
 * - Nettoie les doublons de protocole
 */
export function toExternalDraft(raw: string): string {
  let v = (raw ?? "").trim();

  if (!v || isHttpPrefixOnly(v)) return HTTPS;
  if (v.startsWith("/")) return HTTPS;

  // Si l'utilisateur a mis un schéma non-http(s), on le retire.
  if (!looksLikeAbsoluteHttp(v) && hasScheme(v)) {
    v = v.replace(/^[A-Za-z][A-Za-z0-9+.-]*:/, "");
  }

  // On retire toute accumulation de "http(s)://", puis les slashes initiaux restants.
  v = v.replace(/^(https?:\/\/+)+/i, "").replace(/^\/+/, "");

  return `${HTTPS}${v}`;
}

/* -------------------------------------------------------------------------- */
/*                              Internal HTTP links                           */
/* -------------------------------------------------------------------------- */

/**
 * Transforme une entrée libre en "brouillon" de lien interne (path relatif).
 *
 * - Vide ou préfixe HTTP incomplet → "/"
 * - HTTP(S) absolu → extrait pathname + search + hash
 * - Ancre locale (`#section`) → préserve l’ancre
 * - Sinon → force un leading "/"
 */
export function toInternalDraft(raw: string): string {
  const v = (raw ?? "").trim();

  if (!v || isHttpPrefixOnly(v)) return "/";

  // ✅ Préserve les ancres locales
  if (looksLikeHashAnchor(v)) {
    return v;
  }

  if (looksLikeAbsoluteHttp(v)) {
    try {
      const u = new URL(v);
      const out = (u.pathname || "/") + (u.search || "") + (u.hash || "");
      return normalizeHomeAlias(out || "/");
    } catch {
      // Fallback best-effort : on strip le host si possible.
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

/* -------------------------------------------------------------------------- */
/*                           Normalize (génériques)                           */
/* -------------------------------------------------------------------------- */

/**
 * Normaliser une valeur quelconque en tableau de `T`.
 * - null/undefined → []
 * - array → cast défensif
 * - scalaire → [scalaire]
 *
 * @param filterFalsy Si `true`, supprime les valeurs falsy (`0`, `false`, `""`, `null`, `undefined`).
 */
export function normalizeArray<T>(input: unknown, filterFalsy = true): T[] {
  const arr: T[] = Array.isArray(input)
    ? (input as T[])
    : input == null
      ? []
      : ([input] as T[]);

  return filterFalsy ? arr.filter(Boolean) : arr;
}

/**
 * Normaliser une chaîne (trim).
 * - string → trim
 * - number → String(number)
 * - sinon → fallback
 */
export function normalizeString(str: unknown, fallback = ""): string {
  if (typeof str === "string") return str.trim();
  if (typeof str === "number") return String(str);
  return fallback;
}

/**
 * Permet de normaliser un texte visible (trim + espaces multiples réduits).
 */
export function normalizeVisibleText(input: string): string {
  return normalizeString(input).replace(/\s+/g, " ");
}
