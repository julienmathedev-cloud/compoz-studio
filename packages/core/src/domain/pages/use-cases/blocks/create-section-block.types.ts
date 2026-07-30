/**
 * @file packages/core/src/domain/pages/use-cases/blocks/create-section-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description OCC intent and result contracts for creating a section block.
 */

import type {
  BlockRowReverseOn,
  SectionBlockContainerMode,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { PageBlocksMutationResult } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

export interface CreateSectionBlockDeps {
  pages: PagesRepository;
  idGenerator: IdGenerator;
  nowIso?: () => string;
}

export type CreateSectionBlockColumnInput = Readonly<{
  id?: string;
  cells: ReadonlyArray<Cell>;
}>;

export type CreateSectionBlockRowInput = Readonly<{
  id?: string;
  columnsCount: 1 | 2 | 3;
  reverseOn?: Partial<BlockRowReverseOn>;
  columns: ReadonlyArray<CreateSectionBlockColumnInput>;
}>;

export type BlockPlacement =
  | Readonly<{ kind: "start" }>
  | Readonly<{ kind: "end" }>
  | Readonly<{ kind: "before"; blockId: string }>
  | Readonly<{ kind: "after"; blockId: string }>;

export type CreateSectionBlockInput = Readonly<{
  pageId: string;
  expectedBlocksRevision: number;
  baselineOrder: ReadonlyArray<string>;
  baselineLcpPriorityBlockId: string | null;
  placement: BlockPlacement;
  name?: string;
  containerMode: SectionBlockContainerMode;
  cssClassName?: string;
  lcpPriority: boolean;
  rows: ReadonlyArray<CreateSectionBlockRowInput>;
}>;

export type CreateSectionBlockPatchInput = Omit<
  CreateSectionBlockInput,
  "pageId"
>;

export type CreateSectionBlockResult = PageBlocksMutationResult &
  Readonly<{ createdBlockId: string }>;
