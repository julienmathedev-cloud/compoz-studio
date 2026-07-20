/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Contracts for reordering blocks on a draft page.
 */

import type { Block, BlockId } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

export interface ReorderBlocksDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type ReorderBlocksInput = {
  pageId: string;
  orderedBlockIds: ReadonlyArray<BlockId>;
};

export interface ReorderBlocksResult {
  page: Page;
  blocks: ReadonlyArray<Block>;
}
