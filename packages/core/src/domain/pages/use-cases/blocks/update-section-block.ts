/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Three-way section update through the shared block OCC executor.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block, SectionBlock } from "@compoz/core/domain/pages/entities/block";
import { mergeSectionBlock } from "@compoz/core/domain/pages/revisions/page-blocks-merge";
import type { PageBlocksResolution } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { executePageBlocksMutation } from "@compoz/core/domain/pages/use-cases/blocks/execute-page-blocks-mutation";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";
import type {
  UpdateSectionBlockDeps,
  UpdateSectionBlockInput,
  UpdateSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";

export function updateSectionBlock({
  pages,
  nowIso = () => new Date().toISOString(),
}: UpdateSectionBlockDeps) {
  return async function run(
    input: UpdateSectionBlockInput,
  ): Promise<UpdateSectionBlockResult> {
    const pageId = String(input.pageId ?? "").trim();
    const blockId = String(input.blockId ?? "").trim();
    if (!pageId || !blockId) {
      throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT });
    }

    return executePageBlocksMutation({
      pages,
      pageId,
      expectedBlocksRevision: input.expectedBlocksRevision,
      operation: "update",
      nowIso,
      resolve: (current) => resolveUpdate(input, current),
    });
  };
}

function resolveUpdate(
  input: UpdateSectionBlockInput,
  blocks: ReadonlyArray<Block>,
): PageBlocksResolution {
  const index = blocks.findIndex((block) => block.id === input.blockId);
  if (index < 0) {
    return {
      status: "conflict",
      conflicts: [{
        kind: "blockDeleted",
        path: `blocks[${input.blockId}]`,
        blockId: input.blockId,
      }],
    };
  }

  const current = blocks[index];
  if (current.type !== "section") {
    return {
      status: "conflict",
      conflicts: [{
        kind: "blockTypeChanged",
        path: `blocks[${input.blockId}].type`,
        baseline: "section",
        current: current.type,
        local: "section",
      }],
    };
  }

  const baseline: SectionBlock = { ...current };
  const local: SectionBlock = { ...current };
  if (input.changes.name) {
    baseline.name = input.changes.name.baseline;
    local.name = input.changes.name.local;
  }
  if (input.changes.containerMode) {
    baseline.containerMode = input.changes.containerMode.baseline;
    local.containerMode = input.changes.containerMode.local;
  }
  if (input.changes.cssClassName) {
    baseline.cssClassName = input.changes.cssClassName.baseline;
    local.cssClassName = input.changes.cssClassName.local;
  }
  if (input.changes.lcpPriority) {
    baseline.lcpPriority = input.changes.lcpPriority.baseline;
    local.lcpPriority = input.changes.lcpPriority.local;
  }
  if (input.changes.rows) {
    baseline.rows = input.changes.rows.baseline;
    local.rows = input.changes.rows.local;
  }

  const merged = mergeSectionBlock({ baseline, current, local });
  const candidateBlock = firstValidCandidate([
    merged.candidate,
    local,
    current,
  ]);
  const currentOwner = blocks.find((block) => block.lcpPriority)?.id ?? null;
  if (
    input.changes.lcpPriority?.local === true &&
    currentOwner !== input.baselineLcpPriorityBlockId &&
    currentOwner !== input.blockId
  ) {
    return {
      status: "conflict",
      conflicts: [
        ...merged.conflicts,
        {
          kind: "fieldConflict",
          path: "blocks.lcpPriority",
          location: { kind: "globalLcpOwner" },
          baseline: input.baselineLcpPriorityBlockId,
          current: currentOwner,
          local: input.blockId,
        },
      ],
      ...(candidateBlock ? { candidateBlock } : {}),
    };
  }

  if (merged.conflicts.length > 0) {
    return {
      status: "conflict",
      conflicts: merged.conflicts,
      ...(candidateBlock ? { candidateBlock } : {}),
    };
  }

  let nextBlocks = [...blocks];
  if (merged.candidate.lcpPriority && !current.lcpPriority) {
    nextBlocks = nextBlocks.map((block) => ({
      ...block,
      lcpPriority: block.id === input.blockId,
    }));
  }
  nextBlocks[index] = merged.candidate;

  return {
    status: "resolved",
    blocks: nextBlocks,
    affectedBlockId: input.blockId,
  };
}

function firstValidCandidate(
  candidates: ReadonlyArray<SectionBlock>,
): SectionBlock | undefined {
  return candidates.find((candidate) => {
    try {
      assertBlocks([candidate]);
      return true;
    } catch {
      return false;
    }
  });
}
