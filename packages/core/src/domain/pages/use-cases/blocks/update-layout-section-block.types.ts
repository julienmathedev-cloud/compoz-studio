/**
 * @file packages/core/src/core/domain/pages/use-cases/blocks/update-layout-section-block.types.ts
 * @layer core/domain
 * @description
 * Types du use-case de mise à jour d’un block `LayoutSection`.
 * Définit le contrat **sans logique** (implémentation dans `updateLayoutSectionBlock.ts`).
 */

import type {
  Block,
  BlockId,
  LayoutSectionBlock,
  LayoutSectionBlockTitle,
  LayoutSectionContainerMode,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

// Dépendances du use-case.
export interface UpdateLayoutSectionBlockDeps {
  pages: PagesRepository;
}

// Patch contrôlé d’un LayoutSectionBlock (champs absents = inchangés).
export type LayoutSectionBlockPatch = {
  columns?: 1 | 2 | 3;
  titleEnabled?: boolean;
  title?: LayoutSectionBlockTitle; // undefined: inchangé | objet: remplacé
  lcpPriority?: boolean;
  cells?: ReadonlyArray<Cell>;
  containerMode?: LayoutSectionContainerMode;
};

// Entrée du use-case.
export type UpdateLayoutSectionBlockInput = {
  pageId: string;
  blockId: BlockId;
  patch: LayoutSectionBlockPatch;
};

export type UpdateLayoutSectionBlockPatchInput = Omit<
  UpdateLayoutSectionBlockInput,
  "pageId"
>;

// Résultat du use-case.
export interface UpdateLayoutSectionBlockResult {
  /** Page mise à jour (blocks inclus). */
  page: Page;

  /** Block mis à jour. */
  block: LayoutSectionBlock;

  /** Liste complète des blocks après mise à jour. */
  blocks: ReadonlyArray<Block>;
}
