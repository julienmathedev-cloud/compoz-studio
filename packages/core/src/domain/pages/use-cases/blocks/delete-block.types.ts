/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Contracts for deleting a block from a draft page.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

export interface DeleteBlockDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type DeleteBlockInput = {
  pageId: string;
  blockId: string;
};

export interface DeleteBlockResult {
  page: Page;
  blocks: ReadonlyArray<Block>;
}
