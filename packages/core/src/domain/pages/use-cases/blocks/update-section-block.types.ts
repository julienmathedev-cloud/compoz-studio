/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-section-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Contracts for updating a section block on a draft page.
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

  /** Optional ISO clock override. */
  nowIso?: () => string;
}

/** Missing patch fields preserve current values; provided fields replace them. */
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
  page: Page;

  block: SectionBlock;

  blocks: ReadonlyArray<Block>;
}
