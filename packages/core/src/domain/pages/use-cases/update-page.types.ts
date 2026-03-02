/**
 * @file src/core/domain/pages/use-cases/update-page.types.ts
 * @layer core/domain
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
 * @property pageId - Identifiant de la page à modifier (clé stable).
 * @property title  - Nouveau titre éventuel (validé si présent).
 * @property slug   - Nouveau slug éventuel (unicité vérifiée côté use-case).
 * @property sitemap - Patch partiel du sitemap.
 */
export type UpdatePageInput = {
  pageId: string;
  title?: string;
  slug?: string;
  parentId?: string | null;
  sitemap?: Partial<PageSitemap>;
  paginationEnabled?: boolean;
};

export interface UpdatePageResult {
  page: Page;
}

export interface UpdatePageDeps {
  pages: PagesRepository;
  site?: SiteRepository;
  nowIso?: () => string;
}
