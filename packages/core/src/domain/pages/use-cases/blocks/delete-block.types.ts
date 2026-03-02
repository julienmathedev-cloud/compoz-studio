/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.types.ts
 * @layer core/domain
 * @description
 * Contrat du use-case de suppression d’un block sur une page (édition admin → draft).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

// Dépendances du use-case.
export interface DeleteBlockDeps {
  pages: PagesRepository;
}

// Entrée du use-case.
export type DeleteBlockInput = {
  pageId: string;
  blockId: string;
};

export type DeleteBlockPatchInput = Omit<DeleteBlockInput, "pageId">;

// Résultat du use-case.
export interface DeleteBlockResult {
  page: Page;
  blocks: ReadonlyArray<Block>;
}
