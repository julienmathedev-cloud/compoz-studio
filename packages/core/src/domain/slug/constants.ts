/**
 * @file packages/core/src/domain/slug/constants.ts
 * @layer core/domain
 * @description
 * Source de vérité Domain pour :
 * - la regex stricte acceptée pour les slugs publics,
 * - la liste des slugs réservés (non utilisables pour des pages client).
 *
 * Ces valeurs sont consommées par les schémas Zod et les règles métier du module Pages.
 */

/* -------------------------------------------------------------------------- */
/*                           Regex stricte de validation                       */
/* -------------------------------------------------------------------------- */

/**
 * Regex stricte (canonique) pour un slug :
 * - caractères autorisés : `[a-z0-9]` uniquement,
 * - segments séparés par des tirets (`-`),
 * - interdit les tirets multiples (`foo--bar`) et les débuts/fins en `-`.
 */
export const SLUG_FINAL_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const HOME_SLUG = "home";

/* -------------------------------------------------------------------------- */
/*                               Slugs réservés                               */
/* -------------------------------------------------------------------------- */

/**
 * Liste des slugs **non autorisés** pour les pages du site client,
 * car utilisés ou susceptibles d'être utilisés par l’infrastructure.
 */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "logout",
  "register",
  "signup",
  "account",
  "profile",
  "settings",
  "sitemap",
  "robots",
  "404",
  "500",
  "favicon",
  "assets",
  "static",
  "public",
  "rss",
  "feed",
] as const;
