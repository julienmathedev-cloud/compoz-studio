/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-section-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Types du use-case de mise à jour d’un block `Section`.
 *
 * @remarks
 * - Définit uniquement le contrat.
 * - Aucune logique métier ici.
 */

import type {
  Block,
  BlockId,
  BlockRow,
  SectionBlock,
  SectionBlockContainerMode,
} from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

export interface UpdateSectionBlockDeps {
  pages: PagesRepository;

  /** Horloge ISO optionnelle (défaut : new Date().toISOString()). */
  nowIso?: () => string;
}

/**
 * Patch contrôlé d’un block `Section`.
 *
 * - champ absent : inchangé
 * - champ présent : remplacé
 */
export type SectionBlockPatch = {
  name?: string;
  containerMode?: SectionBlockContainerMode;
  cssClassName?: string;
  lcpPriority?: boolean;
  rows?: ReadonlyArray<BlockRow>;
};

export type UpdateSectionBlockInput = {
  pageId: string;
  blockId: BlockId;
  patch: SectionBlockPatch;
};

export type UpdateSectionBlockPatchInput = Omit<
  UpdateSectionBlockInput,
  "pageId"
>;

export interface UpdateSectionBlockResult {
  /** Page mise à jour. */
  page: Page;

  /** Block mis à jour. */
  block: SectionBlock;

  /** Liste complète des blocks après mise à jour. */
  blocks: ReadonlyArray<Block>;
}
