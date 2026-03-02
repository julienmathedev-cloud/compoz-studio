/**
 * @file src/core/domain/pages/entities/page.ts
 * @layer core/domain
 * @description
 * Entité métier représentant une page de contenu : slug/titre, métadonnées,
 * configuration sitemap et liste de blocks.
 *
 * Invariant : ce fichier définit uniquement la forme canonique (types).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";

/** Fréquences possibles pour le sitemap XML. */
export type SitemapChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

/** Métadonnées de la page (timestamps ISO 8601). */
export interface PageMeta {
  /** Date de création. */
  createdAt: string;
  /** Date de dernière mise à jour. */
  updatedAt: string;
}

/** Paramètres de présence dans le sitemap. */
export interface PageSitemap {
  /** La page doit-elle apparaître dans le sitemap ? */
  include: boolean;
  /** Fréquence d’actualisation suggérée. */
  changefreq?: SitemapChangeFreq;
  /** Priorité suggérée dans [0,1]. */
  priority?: number;
}

/** Entité principale représentant une page de contenu. */
export interface Page {
  /** Identifiant unique de la page (clé métier). */
  id: string;

  parentId: string | null;

  /** Slug unique de la page (clé métier). */
  slug: string;

  /** Titre affiché (admin, listes, éventuellement SEO). */
  title: string;

  /** Blocs de contenu associés à la page (contenu structuré). */
  blocks: ReadonlyArray<Block>;

  /** Métadonnées de création/mise à jour. */
  meta: PageMeta;

  /** Paramètres optionnels pour le sitemap XML. */
  sitemap?: PageSitemap;

  paginationEnabled: boolean;
}

/** Résumé minimal utilisé dans les listes/admin. */
export type PageSummary = Pick<Page, "id" | "slug" | "title" | "parentId">;

/**
 * Option de page interne sélectionnable (picker).
 */
export type InternalPageOption = Readonly<{
  label: string;
  value: string; // valeur à écrire dans href (ex: "/about" ou "/#section")
  slug: string;
}>;
