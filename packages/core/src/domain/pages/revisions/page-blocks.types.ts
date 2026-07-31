/**
 * @file packages/core/src/domain/pages/revisions/page-blocks.types.ts
 * @layer core/domain/pages/revisions
 * @description Stable contracts for draft Page block OCC and functional conflicts.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

export type PageBlocksOperation = "create" | "update" | "delete" | "reorder";
export type PageBlocksMutationOutcome = MutationOutcome;
export type PageBlocksConflictKind = "functional" | "contention";

export type BlockFieldLocationSegment =
  | Readonly<{ kind: "row"; id: string }>
  | Readonly<{ kind: "column"; id: string }>
  | Readonly<{ kind: "cell"; id: string }>
  | Readonly<{ kind: "identifiedItem"; id: string }>
  | Readonly<{ kind: "formField"; id: string }>
  | Readonly<{ kind: "structuredCardSection"; id: string }>
  | Readonly<{ kind: "image" }>
  | Readonly<{ kind: "field"; name: string }>;

export type BlockFieldConflictLocation =
  | Readonly<{
      kind: "blockField";
      blockId: string;
      segments: ReadonlyArray<BlockFieldLocationSegment>;
    }>
  | Readonly<{ kind: "globalLcpOwner" }>;

export type BlockFieldConflict = Readonly<{
  kind: "fieldConflict";
  path: string;
  location: BlockFieldConflictLocation;
  baseline: unknown;
  current: unknown;
  local: unknown;
}>;

export type BlockDeletedConflict = Readonly<{
  kind: "blockDeleted";
  path: string;
  blockId: string;
}>;

export type BlockChangedBeforeDeleteConflict = Readonly<{
  kind: "blockChangedBeforeDelete";
  path: string;
  blockId: string;
  baseline: Block;
  current: Block;
}>;

export type BlockStructuralConflict = Readonly<{
  kind:
    | "blockTypeChanged"
    | "cellTypeChanged"
    | "itemTypeChanged"
    | "collectionIncompatible";
  path: string;
  baseline: unknown;
  current: unknown;
  local: unknown;
}>;

export type BlockIdConflict = Readonly<{
  kind: "idReused" | "anchorMissing";
  path: string;
  id: string;
}>;

export type BlockGlobalInvariantConflict = Readonly<{
  kind: "globalInvariant";
  path: string;
  invariant: string;
}>;

export type BlockOrderConflict = Readonly<{
  kind: "orderIncompatible";
  path: string;
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
  currentOrder: ReadonlyArray<string>;
  addedBlockIds: ReadonlyArray<string>;
  removedBlockIds: ReadonlyArray<string>;
}>;

export type BlockRevisionAheadConflict = Readonly<{
  kind: "revisionAhead";
  path: "blocksRevision";
  expectedBlocksRevision: number;
  currentBlocksRevision: number;
}>;

export type BlockConflict =
  | BlockFieldConflict
  | BlockDeletedConflict
  | BlockChangedBeforeDeleteConflict
  | BlockStructuralConflict
  | BlockIdConflict
  | BlockGlobalInvariantConflict
  | BlockOrderConflict
  | BlockRevisionAheadConflict;

export type PageBlocksSnapshot = Readonly<{
  blocks: ReadonlyArray<Block>;
  blocksRevision: number;
}>;

export type PageBlocksConflictDetails = Readonly<{
  resourceId: string;
  expectedBlocksRevision: number;
  currentBlocksRevision: number;
  operation: PageBlocksOperation;
  conflictKind: PageBlocksConflictKind;
  conflictingPaths: ReadonlyArray<string>;
  conflicts: ReadonlyArray<BlockConflict>;
  current: PageBlocksSnapshot;
  candidateBlock?: Block;
}>;

export type PageBlocksMutationResult = Readonly<{
  outcome: PageBlocksMutationOutcome;
  blocks: ReadonlyArray<Block>;
  blocksRevision: number;
  affectedBlockId?: string;
}>;

export type PageBlocksResolution =
  | Readonly<{
      status: "resolved";
      blocks: ReadonlyArray<Block>;
      affectedBlockId?: string;
    }>
  | Readonly<{
      status: "conflict";
      conflicts: ReadonlyArray<BlockConflict>;
      candidateBlock?: Block;
    }>;
