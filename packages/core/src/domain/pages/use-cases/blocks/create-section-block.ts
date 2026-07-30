/**
 * @file packages/core/src/domain/pages/use-cases/blocks/create-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Creates a section through the shared draft-block OCC executor.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Block,
  BlockColumn,
  BlockRow,
  BlockRowReverseOn,
  SectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import { createPlacementOrder } from "@compoz/core/domain/pages/revisions/page-blocks-merge";
import type { PageBlocksResolution } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { executePageBlocksMutation } from "@compoz/core/domain/pages/use-cases/blocks/execute-page-blocks-mutation";
import type {
  CreateSectionBlockDeps,
  CreateSectionBlockInput,
  CreateSectionBlockResult,
  CreateSectionBlockRowInput,
} from "@compoz/core/domain/pages/use-cases/blocks/create-section-block.types";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

export function createSectionBlock({
  pages,
  idGenerator,
  nowIso = () => new Date().toISOString(),
}: CreateSectionBlockDeps) {
  return async function run(
    input: CreateSectionBlockInput,
  ): Promise<CreateSectionBlockResult> {
    const pageId = String(input.pageId ?? "").trim();
    if (!pageId) {
      throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT });
    }

    const blockId = idGenerator.nextId();
    const nextBlock: SectionBlock = {
      id: blockId,
      type: "section",
      name: String(input.name ?? "").trim() || `Bloc ${input.baselineOrder.length + 1}`,
      containerMode: input.containerMode,
      cssClassName: String(input.cssClassName ?? "").trim() || undefined,
      lcpPriority: input.lcpPriority,
      rows: buildSectionRows(input.rows, idGenerator),
    };

    const result = await executePageBlocksMutation({
      pages,
      pageId,
      expectedBlocksRevision: input.expectedBlocksRevision,
      operation: "create",
      nowIso,
      resolve: (current) => resolveCreate(input, nextBlock, current),
    });

    return { ...result, createdBlockId: blockId };
  };
}

function resolveCreate(
  input: CreateSectionBlockInput,
  nextBlock: SectionBlock,
  current: ReadonlyArray<Block>,
): PageBlocksResolution {
  if (current.some((block) => block.id === nextBlock.id)) {
    return {
      status: "conflict",
      conflicts: [{
        kind: "idReused",
        path: `blocks[${nextBlock.id}]`,
        id: nextBlock.id,
      }],
    };
  }

  const currentOwner =
    current.find((block) => block.lcpPriority)?.id ?? null;
  if (
    nextBlock.lcpPriority &&
    currentOwner !== input.baselineLcpPriorityBlockId &&
    currentOwner !== nextBlock.id
  ) {
    return {
      status: "conflict",
      conflicts: [{
        kind: "fieldConflict",
        path: "blocks.lcpPriority",
        location: { kind: "globalLcpOwner" },
        baseline: input.baselineLcpPriorityBlockId,
        current: currentOwner,
        local: nextBlock.id,
      }],
      candidateBlock: nextBlock,
    };
  }

  const placement = createPlacementOrder({
    baselineOrder: input.baselineOrder,
    currentOrder: current.map((block) => block.id),
    blockId: nextBlock.id,
    placement: input.placement,
  });
  if (placement.status === "anchorMissing") {
    return {
      status: "conflict",
      conflicts: [{
        kind: "anchorMissing",
        path: "placement",
        id: placement.id,
      }],
      candidateBlock: nextBlock,
    };
  }
  if (placement.status === "orderIncompatible") {
    return {
      status: "conflict",
      conflicts: [placement.conflict],
      candidateBlock: nextBlock,
    };
  }

  const byId = new Map(current.map((block) => [block.id, block]));
  byId.set(nextBlock.id, nextBlock);
  let blocks = placement.order.map((id) => byId.get(id)!);
  if (nextBlock.lcpPriority) {
    blocks = blocks.map((block) =>
      block.id === nextBlock.id
        ? block
        : { ...block, lcpPriority: false },
    );
  }

  return {
    status: "resolved",
    blocks,
    affectedBlockId: nextBlock.id,
  };
}

function ensureId(value: string | undefined, idGenerator: IdGenerator): string {
  return String(value ?? "").trim() || idGenerator.nextId();
}

function reverseOn(
  value: Partial<BlockRowReverseOn> | undefined,
): BlockRowReverseOn {
  return {
    mobile: Boolean(value?.mobile),
    tablet: Boolean(value?.tablet),
    desktop: Boolean(value?.desktop),
  };
}

function buildSectionRows(
  rows: ReadonlyArray<CreateSectionBlockRowInput>,
  idGenerator: IdGenerator,
): BlockRow[] {
  return rows.map((row) => ({
    id: ensureId(row.id, idGenerator),
    columnsCount: row.columnsCount,
    reverseOn: reverseOn(row.reverseOn),
    columns: row.columns.map<BlockColumn>((column) => ({
      id: ensureId(column.id, idGenerator),
      cells: [...column.cells],
    })),
  }));
}
