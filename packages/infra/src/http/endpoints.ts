/**
 * @file packages/infra/src/http/endpoints.ts
 * @layer infra/http
 * @description
 * Table centralisée des endpoints HTTP pour l’API Studio.
 *
 * Responsabilités :
 * - construction de chemins robustes (normalisation des segments),
 * - gestion d’un préfixe/une version via env,
 * - source unique des URLs consommées côté client et tests.
 *
 * @remarks
 * Variables supportées :
 * - NEXT_PUBLIC_API_PREFIX (ex: "/api")
 * - NEXT_PUBLIC_API_VERSION (ex: "v1")
 */

const TRIM_SLASHES_RE = /^\/+|\/+$/g;

function ep(...segs: Array<string | number | null | undefined>): string {
  const parts = segs
    .filter((s): s is string | number => s != null)
    .map((s) => String(s).replace(TRIM_SLASHES_RE, ""))
    .filter(Boolean);

  return "/" + parts.join("/");
}

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;
const VERSION_SEG = API_VERSION ? [API_VERSION] : [];

/**
 * Base API pour l’app Studio.
 * Exemple: "/api" ou "/api/v1" si versionnée.
 */
const STUDIO_BASE = ep(API_PREFIX, ...VERSION_SEG);

const SITE_BASE = ep(STUDIO_BASE, "site");
const SETTINGS_BASE = ep(STUDIO_BASE, "settings");
const MEDIA_BASE = ep(STUDIO_BASE, "media");

export const ENDPOINTS = {
  STUDIO: {
    base: STUDIO_BASE,

    /** Routes de gestion des pages. */
    PAGES: {
      base: ep(STUDIO_BASE, "pages"),

      // API "DB-like"
      byId: (pageId: string | number) => ep(STUDIO_BASE, "pages", pageId),

      blocksById: (pageId: string | number) =>
        ep(STUDIO_BASE, "pages", pageId, "blocks"),
    },

    /**
     * Routes de gestion des users Studio.
     *
     * @remarks
     * Les segments "admin/users" sont conservés tels quels ici (compat / historique).
     */
    USERS: {
      base: ep(STUDIO_BASE, "admin/users"),

      byId: (userId: string | number) => ep(STUDIO_BASE, "admin/users", userId),
    },

    TENANT: {
      base: ep(STUDIO_BASE, "admin/tenant"),
      active: ep(STUDIO_BASE, "admin/tenant", "active"),
    },

    /** Routes de gestion des site settings (sous-sections). */
    SETTINGS: {
      base: SETTINGS_BASE,
      header: ep(SETTINGS_BASE, "header"),
      footer: ep(SETTINGS_BASE, "footer"),
      primaryMenu: ep(SETTINGS_BASE, "primary-menu"),
      legalMenu: ep(SETTINGS_BASE, "legal-menu"),
      identity: ep(SETTINGS_BASE, "identity"),
      social: ep(SETTINGS_BASE, "social"),
      seo: ep(SETTINGS_BASE, "seo"),
      bundle: ep(SETTINGS_BASE, "bundle"),
    },

    /** Routes liées aux médias (uploads, etc.). */
    MEDIA: {
      base: MEDIA_BASE,
      upload: ep(MEDIA_BASE, "upload"),
      uploadImage: ep(MEDIA_BASE, "upload", "image"),
      uploadSvg: ep(MEDIA_BASE, "upload", "svg"),
    },

    SITE: {
      base: SITE_BASE,
      publish: ep(SITE_BASE, "publish"),
      status: ep(SITE_BASE, "status"),
      statusDetails: ep(SITE_BASE, "status", "details"),
    },
  },
} as const;

export type EndpointMap = typeof ENDPOINTS;
