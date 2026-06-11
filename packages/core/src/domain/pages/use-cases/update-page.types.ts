/**
 * @file packages/core/src/domain/pages/use-cases/update-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description
 * Types du use-case de mise à jour d’une page : entrées, sorties et dépendances.
 * Définit le contrat **sans logique** (implémentation dans `update-page.ts`).
 */

import type {
  Page,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

/**
 * Entrée du use-case `updatePage`.
 *
 * @remarks
 * - Les champs restent optionnels car il s’agit d’un patch partiel.
 * - `seoTitle`, `seoDescription` et `sitemap` peuvent être explicitement remis à `null`.
 */
export type UpdatePageInput = {
  pageId: string;
  name?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string;
  parentId?: string | null;
  sitemap?: Partial<PageSitemap> | null;
  paginationEnabled?: boolean;
};

export interface UpdatePageResult {
  page: Page;
}

export interface UpdatePageDeps {
  pages: PagesRepository;

  /**
   * Dépôt site optionnel : si fourni, permet de mettre à jour certains href
   * (menus) lors d’un rename de slug.
   */
  site?: SiteRepository;

  nowIso?: () => string;
}

export type ChangedKey = keyof Pick<
  Page,
  | "name"
  | "slug"
  | "parentId"
  | "sitemap"
  | "paginationEnabled"
  | "seoTitle"
  | "seoDescription"
>;
