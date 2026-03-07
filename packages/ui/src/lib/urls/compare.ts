/**
 * @file packages/ui/src/lib/urls/compare.ts
 * @layer ui/lib/urls
 * @description
 * Génère des clés de comparaison stables pour dédupliquer des `href` et des labels
 * (menus, liens sociaux, etc.).
 *
 * ⚠️ Ces normalisations sont **uniquement** destinées à la comparaison (détection de doublons).
 * Ne pas utiliser pour une URL canonique de persistance.
 *
 * @remarks
 * Dépendances `@compoz/core/domain/urls/*` : helpers "purs" de parsing/guards URL.
 */

import { isAbsoluteHttpProtocol } from "@compoz/core/domain/urls/guards";
import { parseMailto } from "@compoz/core/domain/urls/mailto";

/**
 * Normalise un chemin "interne" pour comparaison.
 *
 * - Trim
 * - Tolère "about" → "/about" (évite les doublons admin)
 * - Collapse des "//" multiples
 * - Suppression du trailing slash sauf pour "/"
 */
function normalizeRelativePath(input: string): string {
  let p = (input ?? "").trim();
  if (!p) return "";

  // On ne touche pas aux ancres ou aux query-only.
  if (p.startsWith("#") || p.startsWith("?")) return p;

  // Tolérance UX admin : "about" -> "/about"
  if (!p.startsWith("/")) p = `/${p}`;

  // Remplace les occurrences "//" multiples par un seul "/"
  p = p.replace(/\/{2,}/g, "/");

  // Retire un slash final superflu (ex: "/about/")
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  return p;
}

/**
 * Normalise une URL de protocole "spécial" pour comparaison.
 *
 * @remarks
 * - Ne tente pas de "réparer" ou parser le contenu, on veut juste une clé stable.
 * - Ex: `TEL:+33...` => `tel:+33...`
 */
function normalizeSpecialProtocol(href: string): string {
  const s = (href ?? "").trim();
  const i = s.indexOf(":");
  if (i <= 0) return s;

  const proto = s.slice(0, i).toLowerCase();
  const rest = s.slice(i + 1); // on garde le reste tel quel (numéro, params…)
  return `${proto}:${rest}`;
}

/**
 * Trie les paramètres de recherche (query) pour produire une forme stable.
 *
 * Donne comme résultat : "?a=1&a=2&b=3" → clé de comparaison déterministe.
 */
export function sortSearchParams(raw: string): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  // URLSearchParams accepte avec ou sans "?" — on le strip pour éviter les surprises.
  const normalized = input.startsWith("?") ? input.slice(1) : input;

  const params = new URLSearchParams(normalized);
  const ordered = new URLSearchParams();

  // On trie les clés puis les valeurs pour une comparaison cohérente.
  const keys = Array.from(new Set(Array.from(params.keys()))).sort();
  keys.forEach((k) => {
    const vals = params.getAll(k);
    vals.sort();
    vals.forEach((v) => ordered.append(k, v));
  });

  const out = ordered.toString();
  return out ? `?${out}` : "";
}

/**
 * Normalise une URL HTTP(S) :
 * - Protocole et hostname en lower-case.
 * - Suppression des ports par défaut (80 pour HTTP, 443 pour HTTPS).
 * - Normalisation du path (slashes, trailing slash).
 * - Query params triés.
 * - Hash conservé tel quel.
 *
 * Supporte aussi les URLs protocol-relative ("//example.com/x")
 * en les interprétant comme HTTPS pour la comparaison.
 *
 * Retourne `null` si l’URL n'est pas de type http(s):.
 */
function normalizeHttpLike(href: string): string | null {
  try {
    // URL protocol-relative : on choisit HTTPS pour la comparaison
    // (objectif: dédupe stable, pas de persistance).
    const raw = href.startsWith("//") ? `https:${href}` : href;

    const u = new URL(raw);
    if (!isAbsoluteHttpProtocol(u.protocol)) return null;

    const protocol = u.protocol.toLowerCase();
    const host = u.hostname.toLowerCase();

    // Détection d’un port par défaut → on l’ignore dans la clé de comparaison.
    const isDefaultPort =
      (protocol === "http:" && (u.port === "" || u.port === "80")) ||
      (protocol === "https:" && (u.port === "" || u.port === "443"));

    // Normalisation du chemin
    let path = u.pathname.replace(/\/{2,}/g, "/");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    const search = sortSearchParams(u.search);
    const hash = u.hash; // fragment conservé

    return `${protocol}//${host}${
      isDefaultPort ? "" : `:${u.port}`
    }${path}${search}${hash}`;
  } catch {
    return null;
  }
}

/**
 * Normalise un lien mailto:
 * - Destinataires en lower-case
 * - Destinataires uniques + triés
 * - Query params triés
 */
function normalizeMailto(href: string): string | null {
  const parsed = parseMailto(href);
  if (!parsed) return null;

  // Destinataires en lower-case, uniques, triés.
  const to = Array.from(
    new Set(parsed.recipients.map((r) => r.toLowerCase())),
  ).sort();

  // Tri des paramètres et de leurs valeurs.
  const params = new URLSearchParams();
  Array.from(new Set(Array.from(parsed.params.keys()).sort())).forEach((k) => {
    const vals = parsed.params.getAll(k);
    vals.sort();
    vals.forEach((v) => params.append(k, v));
  });

  const q = params.toString();
  return `mailto:${to.join(",")}${q ? `?${q}` : ""}`;
}

/**
 * Génère une clé de comparaison stable pour un href.
 *
 * - Détecte le protocole ("mailto:", "tel:", "http:", "https:")
 * - Sélectionne la normalisation adaptée
 * - Fallback : considère le lien comme chemin relatif (tolérant)
 */
export function hrefCompareKey(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";

  // URLs protocol-relative : on les traite comme des http(s) comparables
  if (s.startsWith("//")) {
    return normalizeHttpLike(s) ?? s;
  }

  const i = s.indexOf(":");

  // Cas protocole explicite : mailto/tel ou http(s)
  if (i > 0) {
    const proto = s.slice(0, i + 1).toLowerCase();

    if (proto === "mailto:") return normalizeMailto(s) ?? s;

    // `tel:` est un protocole "spécial" : on le normalise seulement sur la casse.
    if (proto === "tel:") return normalizeSpecialProtocol(s);

    const http = normalizeHttpLike(s);
    if (http) return http;
  }

  // Cas par défaut : chemin relatif (avec tolérance "about" -> "/about")
  return normalizeRelativePath(s);
}

/**
 * Génère une clé de comparaison pour un label :
 * trim + lower-case.
 */
export function labelCompareKey(label: string): string {
  return (label ?? "").trim().toLowerCase();
}
