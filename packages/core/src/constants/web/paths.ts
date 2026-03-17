/**
 * @file packages/core/src/constants/web/paths.ts
 * @layer core/constants/web
 * @description
 * Paths internes utilisés dans l'application Studio.
 * Centralise les routes de navigation (sidebar / sections / pages système).
 */
/**
 * Routes liées à l'administration des utilisateurs dans Studio.
 * (gestion comptes / rôles / accès).
 */
const ADMIN_PATH = {
  root: "/admin",
  users: "/admin/users",
} as const;

/**
 * Routes principales du Studio (navigation sidebar).
 */
export const STUDIO_PATH = {
  overview: "/",
  identity: "/identity",
  menu: "/menu",
  social: "/social",
  header: "/header",
  footer: "/footer",
  pages: "/pages",
  blocks: "/blocks",
  seo: "/seo",
  theme: "/theme",
  adminPath: ADMIN_PATH,
  mentionsLegales: "/mentions-legales",
  confidentialite: "/confidentialite",
  cookies: "/cookies",

  preview: "/preview",
  draft: "/draft",
} as const;

/**
 * Chemins du site (surface "site", non-Studio).
 */
export const SITE_PATH = {
  home: "/",
} as const;
