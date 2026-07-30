/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-section-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description OCC intent contracts for updating a section block.
 */

import type {
  BlockId,
  BlockRow,
  SectionBlockContainerMode,
} from "@compoz/core/domain/pages/entities/block";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { PageBlocksMutationResult } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export interface UpdateSectionBlockDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type MetadataChange<T> = Readonly<{ baseline: T; local: T }>;

export type UpdateSectionBlockChanges = Readonly<{
  name?: MetadataChange<string>;
  containerMode?: MetadataChange<SectionBlockContainerMode>;
  cssClassName?: MetadataChange<string | undefined>;
  lcpPriority?: MetadataChange<boolean>;
  rows?: MetadataChange<ReadonlyArray<BlockRow>>;
}>;

/** Kept as a local editing helper; interactive persistence uses changes. */
export type SectionBlockPatch = Readonly<{
  name?: string;
  containerMode?: SectionBlockContainerMode;
  cssClassName?: string;
  lcpPriority?: boolean;
  rows?: ReadonlyArray<BlockRow>;
}>;

export type UpdateSectionBlockInput = Readonly<{
  pageId: string;
  blockId: BlockId;
  expectedBlocksRevision: number;
  baselineLcpPriorityBlockId: string | null;
  changes: UpdateSectionBlockChanges;
}>;

export type UpdateSectionBlockPatchInput = Omit<
  UpdateSectionBlockInput,
  "pageId" | "blockId"
>;

export type UpdateSectionBlockResult = PageBlocksMutationResult;
