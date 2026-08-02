/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for reordering a parent's children in the draft index.
 * @remarks Writes go through the dedicated draft structure transaction.
 */

import type {
  DraftPageStructureTransaction,
  DraftStructureMutationResult,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";

export type ReorderPageChildrenDeps = Readonly<{
  structure: DraftPageStructureTransaction;
}>;

export type ReorderPageChildrenInput = Readonly<{
  parentId: string;
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  expectedDraftStructureRevision: number;
}>;

export type ReorderPageChildrenResult = DraftStructureMutationResult;
