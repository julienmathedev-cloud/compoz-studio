/**
 * @file packages/core/src/constants/web/paths.ts
 * @layer core/constants/web
 * @description Internal route constants shared by Studio and public site code.
 */
const ADMIN_PATH = {
  root: "/admin",
  users: "/admin/users",
} as const;

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

export const SITE_PATH = {
  home: "/",
} as const;
