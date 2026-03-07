/**
 * @file packages/core/src/domain/slug/utils.ts
 * @layer core/domain
 * @description
 * Ce module fournit :
 * - une normalisation ASCII stable à partir d’une entrée libre,
 * - deux helpers booléens : validité syntaxique (regex) et slug réservé.
 *
 * Invariant : la normalisation ne vaut pas validation.
 * Les callers doivent gérer les cas où le résultat est vide
 * ou non conforme à la regex.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import {
  HOME_SLUG,
  RESERVED_SLUGS,
  SLUG_FINAL_RE,
} from "@compoz/core/domain/slug/constants";

/* -------------------------------------------------------------------------- */
/*                            Normalisation ASCII                             */
/* -------------------------------------------------------------------------- */

/**
 * Normalise un slug à partir d’une entrée libre.
 *
 * @param input  Chaîne entrée libre (ex: "  Événement VIP 2024 !!  ")
 * @param maxLen Longueur max optionnelle (ex: 50 pour SEO)
 * @returns slug normalisé (peut être vide si input vide)
 *
 * @example
 * normalizeSlug("Événement Promo 2024!") // → "evenement-promo-2024"
 */
export function normalizeSlug(input: string, maxLen?: number): string {
  if (!input) return "";

  // 1) Trim + lower
  let s = input.trim().toLowerCase();
  if (!s) return "";

  // 2) Supprime les diacritiques (é → e)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3) Transforme tout ce qui n'est pas a-z0-9 en tiret
  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  // 4) Limitation optionnelle
  if (typeof maxLen === "number" && maxLen > 0 && s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/-+$/g, "");
  }

  return s;
}

/* -------------------------------------------------------------------------- */
/*                                  Validation                                */
/* -------------------------------------------------------------------------- */

/**
 * Vérifie qu’un slug respecte la regex stricte (canonique).
 *
 * Note :
 * - `normalizeSlug()` ne garantit pas la validité :
 *   - le résultat peut être vide,
 *   - ou non conforme si l’entrée est pathologique.
 */
export function isValidSlug(s: string): boolean {
  return SLUG_FINAL_RE.test(s);
}

/* -------------------------------------------------------------------------- */
/*                             Slugs réservés                                 */
/* -------------------------------------------------------------------------- */

/** Pré-calcul pour des lookups O(1) */
const RESERVED_SET = new Set<string>(RESERVED_SLUGS);

/**
 * Vérifie si un slug est réservé (système / infra).
 *
 * - Normalise d’abord l’entrée (`normalizeSlug`)
 * - Vérifie la présence dans `RESERVED_SLUGS`
 */
export function isReservedSlug(slug: string): boolean {
  const n = normalizeSlug(slug);
  return n.length > 0 && RESERVED_SET.has(n);
}

export function toInternalPathFromSlug(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s || s === HOME_SLUG) return SITE_PATH.home;
  return `/${s.replace(/^\/+/, "")}`;
}

export function normalizeSlugInput(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  if (raw === SITE_PATH.home) return HOME_SLUG;

  const stripped = raw.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!stripped) return HOME_SLUG;

  return stripped;
}
