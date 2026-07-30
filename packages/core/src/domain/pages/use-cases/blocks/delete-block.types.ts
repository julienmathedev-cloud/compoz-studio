/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description OCC intent contracts for deleting a draft block.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { PageBlocksMutationResult } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export interface DeleteBlockDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type DeleteBlockInput = Readonly<{
  pageId: string;
  blockId: string;
  expectedBlocksRevision: number;
  baselineBlock: Block;
}>;

export type DeleteBlockResult = PageBlocksMutationResult;
