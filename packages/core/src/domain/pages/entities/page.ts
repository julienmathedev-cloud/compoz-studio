/**
 * @file packages/core/src/domain/pages/entities/page.ts
 * @layer core/domain/pages
 * @description
 * Entité métier représentant une page de contenu : slug/titre, métadonnées,
 * configuration sitemap et liste de blocks.
 *
 * Invariant : ce fichier définit uniquement la forme canonique (types).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";

/** Fréquences possibles pour le sitemap XML (valeurs standard). */
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
  changefreq: SitemapChangeFreq | null;
  /** Priorité suggérée dans [0,1]. */
  priority: number | null;
}

/** Entité principale représentant une page de contenu. */
export interface Page {
  /** Identifiant unique de la page (clé métier). */
  id: string;

  /**
   * Référence à la page parente (null = page racine).
   * Utilisé pour structurer l’arborescence (menus, pagination, navigation).
   */
  parentId: string | null;

  /** Slug unique de la page (clé métier). */
  slug: string;

  /** Nom affiché (studio, listes, éventuellement SEO). */
  name: string;

  /** Titre SEO. */
  seoTitle: string | null;

  /** Blocs de contenu associés à la page (contenu structuré). */
  blocks: ReadonlyArray<Block>;

  /** Métadonnées de création/mise à jour. */
  meta: PageMeta;

  /** Paramètres pour le sitemap XML. */
  sitemap: PageSitemap | null;

  /**
   * Active/désactive la pagination pour une page enfant.
   * (Invariant validé au runtime : une page racine ne peut pas paginer.)
   */
  paginationEnabled: boolean;
}

/** Résumé minimal utilisé dans les listes (studio). */
export type PageSummary = Pick<Page, "id" | "slug" | "name" | "parentId">;

/**
 * Option de page interne sélectionnable (picker).
 */
export type InternalPageOption = Readonly<{
  label: string;

  /** Chemin interne à écrire dans `href` (ex: "/about" ou "/#section"). */
  value: string;

  /** Slug de la page ciblée (utile pour lookup/affichage). */
  slug: string;
}>;
