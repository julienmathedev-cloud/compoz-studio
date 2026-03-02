/**
 * @file packages/core/src/domain/pages/use-cases/blocks/add-layout-section-block.types.ts
 * @layer core/domain
 * @description
 * Types du use-case d’ajout d’un block `LayoutSection` sur une page (édition admin → draft).
 * Définit le contrat **sans logique** (implémentation dans `addLayoutSectionBlock.ts`).
 */

import type {
  Block,
  LayoutSectionBlock,
  LayoutSectionBlockTitle,
  LayoutSectionContainerMode,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

/**
 * Dépendances nécessaires à l’exécution du use-case.
 */
export interface AddLayoutSectionBlockDeps {
  pages: PagesRepository;
}

/**
 * Données d’entrée pour l’ajout d’un block LayoutSection.
 */
export type AddLayoutSectionBlockInput = {
  /** Id de la page à modifier. */
  pageId: string;

  /** Nombre de colonnes (1 à 3). */
  columns: 1 | 2 | 3;

  /** Position d’insertion (0..n). Par défaut : fin de liste. */
  insertAt?: number;

  titleEnabled: boolean;

  /** Titre optionnel de la section. */
  title: LayoutSectionBlockTitle;

  lcpPriority: boolean;

  containerMode: LayoutSectionContainerMode;

  cells: ReadonlyArray<Cell>;
};

export type AddLayoutSectionBlockPatchInput = Omit<
  AddLayoutSectionBlockInput,
  "pageId"
>;

/**
 * Résultat de l’ajout.
 */
export interface AddLayoutSectionBlockResult {
  /** Page mise à jour (blocks inclus). */
  page: Page;

  /** Block créé. */
  block: LayoutSectionBlock;

  /** Nouvelle liste de blocks (ordre inclus). */
  blocks: ReadonlyArray<Block>;
}
