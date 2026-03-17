/**
 * @file packages/core/src/domain/pages/use-cases/create-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description
 * Types du use-case de création de page : entrées, sorties et dépendances.
 * Définit le contrat **sans logique** (implémentation dans `create-page.ts`).
 */

import type {
  Page,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

/**
 * Dépendances nécessaires à l’exécution du use-case.
 * - `pages` : accès CRUD aux pages (draft/published).
 * - `idGenerator` : générateur d’ID stable (injectable, testable).
 * - `nowIso` : horloge injectable (tests, déterminisme).
 */
export interface CreatePageDeps {
  pages: PagesRepository;
  idGenerator: IdGenerator;

  /** Horloge ISO optionnelle (défaut : new Date().toISOString()). */
  nowIso?: () => string;
}

/**
 * Données d’entrée pour la création d’une page.
 * - `name` (obligatoire) : doit être non vide (validé dans le use-case).
 * - `slug`  (optionnel)  : si absent, dérivé du titre.
 * - `sitemap` (optionnel) : partiel ; s’il est fourni, il est complété via `applySitemapDefaults()`.
 *
 * @remarks
 * La création se fait toujours en **draft** ; la publication est gérée par un use-case dédié.
 */
export type CreatePageInput = {
  name: string;
  slug?: string;
  seoTitle?: string;
  parentId: string | null;
  sitemap?: Partial<PageSitemap>;
  existingSlugs?: ReadonlySet<string>;
  paginationEnabled: boolean;
};

/**
 * Résultat de la création.
 * - Retourne toujours la page complète persistée.
 */
export interface CreatePageResult {
  page: Page;
}
