/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Contrat du use-case de réordonnancement des blocks d’une page (édition admin → draft).
 */

import type { Block, BlockId } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

// Dépendances du use-case.
export interface ReorderBlocksDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type ReorderBlocksInput = {
  pageId: string;
  orderedBlockIds: ReadonlyArray<BlockId>;
};

export type ReorderBlocksPatchInput = Omit<ReorderBlocksInput, "pageId">;

export interface ReorderBlocksResult {
  page: Page;
  blocks: ReadonlyArray<Block>;
}
