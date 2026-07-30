/**
 * @file packages/core/src/domain/pages/use-cases/blocks/execute-page-blocks-mutation.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Shared bounded read-resolve-CAS executor for all draft block mutations.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { pageBlockValueEquals } from "@compoz/core/domain/pages/revisions/page-blocks-equality";
import type {
  PageBlocksConflictDetails,
  PageBlocksMutationResult,
  PageBlocksOperation,
  PageBlocksResolution,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

const MAX_ATTEMPTS = 3;

type ExecutePageBlocksMutationInput = Readonly<{
  pages: PagesRepository;
  pageId: string;
  expectedBlocksRevision: number;
  operation: PageBlocksOperation;
  nowIso: () => string;
  resolve: (current: ReadonlyArray<Block>) => PageBlocksResolution;
}>;

function conflict(
  input: Omit<PageBlocksConflictDetails, "conflictingPaths"> & {
    conflictingPaths?: ReadonlyArray<string>;
  },
): never {
  const paths =
    input.conflictingPaths ??
    input.conflicts.map((item) => item.path);

  throw new DomainError({
    code: ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
    message: ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT,
    details: { ...input, conflictingPaths: [...new Set(paths)] },
  });
}

function assertExpectedRevision(value: number | undefined): number {
  if (value === undefined || value === null) {
    throw new DomainError({
      code: ERROR_CODES.REVISION_REQUIRED,
      message: ERROR_CODES.REVISION_REQUIRED,
    });
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DomainError({
      code: ERROR_CODES.INVALID_ARGUMENT,
      message: ERROR_CODES.INVALID_ARGUMENT,
      details: { path: ["expectedBlocksRevision"] },
    });
  }
  return value;
}

export async function executePageBlocksMutation(
  input: ExecutePageBlocksMutationInput,
): Promise<PageBlocksMutationResult> {
  const expectedBlocksRevision = assertExpectedRevision(
    input.expectedBlocksRevision,
  );

  await input.pages.ensureBase();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const read = await input.pages.readByIdWithRevisions(
      DEFAULT_CONTENT_STATE,
      input.pageId,
    );

    if (!read) {
      throw new DomainError({
        code: ERROR_CODES.PAGE_NOT_FOUND,
        message: ERROR_CODES.PAGE_NOT_FOUND,
        details: { path: ["pageId"], meta: { pageId: input.pageId } },
      });
    }

    const currentRevision = read.revisions.blocksRevision;
    const currentBlocks = read.page.blocks;

    if (expectedBlocksRevision > currentRevision) {
      conflict({
        resourceId: input.pageId,
        expectedBlocksRevision,
        currentBlocksRevision: currentRevision,
        operation: input.operation,
        conflictKind: "functional",
        conflicts: [{
          kind: "revisionAhead",
          path: "blocksRevision",
          expectedBlocksRevision,
          currentBlocksRevision: currentRevision,
        }],
        current: { blocks: currentBlocks, blocksRevision: currentRevision },
      });
    }

    const resolution = input.resolve(currentBlocks);

    if (resolution.status === "conflict") {
      conflict({
        resourceId: input.pageId,
        expectedBlocksRevision,
        currentBlocksRevision: currentRevision,
        operation: input.operation,
        conflictKind: "functional",
        conflicts: resolution.conflicts,
        current: { blocks: currentBlocks, blocksRevision: currentRevision },
        ...(resolution.candidateBlock
          ? { candidateBlock: resolution.candidateBlock }
          : {}),
      });
    }

    if (pageBlockValueEquals(resolution.blocks, currentBlocks)) {
      return {
        outcome: "noChanges",
        blocks: currentBlocks,
        blocksRevision: currentRevision,
        ...(resolution.affectedBlockId
          ? { affectedBlockId: resolution.affectedBlockId }
          : {}),
      };
    }

    try {
      assertBlocks(resolution.blocks);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      conflict({
        resourceId: input.pageId,
        expectedBlocksRevision,
        currentBlocksRevision: currentRevision,
        operation: input.operation,
        conflictKind: "functional",
        conflicts: [{
          kind: "globalInvariant",
          path: "blocks",
          invariant: error.code,
        }],
        current: { blocks: currentBlocks, blocksRevision: currentRevision },
        ...(resolution.affectedBlockId
          ? {
              candidateBlock: resolution.blocks.find(
                (block) => block.id === resolution.affectedBlockId,
              ),
            }
          : {}),
      });
    }

    const updated = await input.pages.compareAndSetDraftPageBlocks({
      pageId: input.pageId,
      expectedBlocksRevision: currentRevision,
      blocks: resolution.blocks,
      metaUpdatedAt: input.nowIso(),
    });

    if (updated) {
      return {
        outcome: "updated",
        blocks: resolution.blocks,
        blocksRevision: currentRevision + 1,
        ...(resolution.affectedBlockId
          ? { affectedBlockId: resolution.affectedBlockId }
          : {}),
      };
    }
  }

  const current = await input.pages.readByIdWithRevisions(
    DEFAULT_CONTENT_STATE,
    input.pageId,
  );

  if (!current) {
    throw new DomainError({
      code: ERROR_CODES.PAGE_NOT_FOUND,
      message: ERROR_CODES.PAGE_NOT_FOUND,
    });
  }

  conflict({
    resourceId: input.pageId,
    expectedBlocksRevision,
    currentBlocksRevision: current.revisions.blocksRevision,
    operation: input.operation,
    conflictKind: "contention",
    conflicts: [],
    conflictingPaths: [],
    current: {
      blocks: current.page.blocks,
      blocksRevision: current.revisions.blocksRevision,
    },
  });
}
