/**
 * @file packages/core/src/domain/slug/constants.ts
 * @layer core/domain/slug
 * @description Canonical slug constants shared by domain rules and validation schemas.
 * @remarks
 * Reserved slugs protect infrastructure routes from being reused as customer page slugs.
 */

/** Canonical public slug pattern: lowercase alphanumeric segments separated by single dashes. */
export const SLUG_FINAL_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const HOME_SLUG = "home";

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
