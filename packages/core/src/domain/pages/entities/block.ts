/**
 * @file packages/core/src/domain/pages/entities/block.ts
 * @layer core/domain/pages
 * @description Canonical domain model for page sections and nested layout.
 * @remarks
 * Blocks own section-level layout and performance options.
 */

import type { Cell } from "@compoz/core/domain/pages/entities/cell";

export type BlockId = string;
export type BlockRowId = string;
export type BlockColumnId = string;

export type BlockType = "section";

export type SectionBlockContainerMode = "contained" | "fullBleed";

export interface BlockRowReverseOn {
  mobile: boolean;

  tablet: boolean;

  desktop: boolean;
}

export interface BlockRow {
  id: BlockRowId;

  columnsCount: 1 | 2 | 3;

  reverseOn: BlockRowReverseOn;

  /** Domain invariant: `columns.length === columnsCount`. */
  columns: ReadonlyArray<BlockColumn>;
}

export interface BlockColumn {
  id: BlockColumnId;

  cells: ReadonlyArray<Cell>;
}

export interface SectionBlock {
  id: BlockId;

  type: "section";

  name: string;

  containerMode: SectionBlockContainerMode;

  cssClassName?: string;

  /** Marks the section as a candidate for LCP media prioritization by the rendering layer. */
  lcpPriority: boolean;

  rows: ReadonlyArray<BlockRow>;
}

/** V0.5 only supports section blocks. */
export type Block = SectionBlock;
