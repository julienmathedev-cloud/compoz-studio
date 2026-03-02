/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.ts
 * @layer core/domain
 * @description
 * Use-case de réordonnancement des blocks d’une page (édition admin → draft).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

import type {
  ReorderBlocksDeps,
  ReorderBlocksInput,
  ReorderBlocksResult,
} from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks.types";

export function reorderBlocks({ pages }: ReorderBlocksDeps) {
  return async function run(
    input: ReorderBlocksInput,
  ): Promise<ReorderBlocksResult> {
    await pages.ensureBase();

    const page = await pages.readById(WRITE_CONTENT_STATE, input.pageId);
    if (!page) {
      throw new DomainError({
        code: EC.PAGE_NOT_FOUND,
        message: EC.PAGE_NOT_FOUND,
        details: {
          path: ["pageId"],
          meta: { pageId: input.pageId, WRITE_CONTENT_STATE },
        },
      });
    }

    const currentBlocks: Block[] = Array.isArray(page.blocks)
      ? page.blocks
      : [];
    const currentIds = currentBlocks.map((b) => b.id);

    assertPermutation({
      ordered: input.orderedBlockIds,
      current: currentIds,
    });

    const byId = new Map<string, Block>();
    for (const b of currentBlocks) byId.set(b.id, b);

    const nextBlocks: Block[] = input.orderedBlockIds.map((id) => {
      // safe car assertPermutation() a déjà garanti la présence.
      return byId.get(id)!;
    });

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: { ...page.meta, updatedAt: new Date().toISOString() },
    };

    await pages.put(WRITE_CONTENT_STATE, nextPage);

    return { page: nextPage, blocks: nextBlocks };
  };
}

/* -------------------------------------------------------------------------- */
/*                               Inline helpers                               */
/* -------------------------------------------------------------------------- */

type AssertPermutationProps = {
  ordered: ReadonlyArray<string>;
  current: ReadonlyArray<string>;
};

function assertPermutation({ ordered, current }: AssertPermutationProps): void {
  if (!Array.isArray(ordered)) {
    throw new DomainError({
      code: EC.BLOCKS_INVALID,
      message: EC.BLOCKS_INVALID,
      details: { path: ["orderedBlockIds"] },
    });
  }

  const currentSet = new Set(current);
  const seen = new Set<string>();

  for (let i = 0; i < ordered.length; i += 1) {
    const id = ordered[i]?.trim?.() ?? "";

    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_ID_REQUIRED,
        message: EC.BLOCK_ID_REQUIRED,
        details: { path: ["orderedBlockIds", i] },
      });
    }

    if (seen.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_ID_DUPLICATE,
        message: EC.BLOCK_ID_DUPLICATE,
        details: { path: ["orderedBlockIds", i], meta: { id } },
      });
    }
    seen.add(id);

    if (!currentSet.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_NOT_FOUND,
        message: EC.BLOCK_NOT_FOUND,
        details: { path: ["orderedBlockIds", i], meta: { id } },
      });
    }
  }

  if (ordered.length !== current.length) {
    throw new DomainError({
      code: EC.BLOCKS_INVALID,
      message: EC.BLOCKS_INVALID,
      details: {
        path: ["orderedBlockIds"],
        meta: { expected: current.length, actual: ordered.length },
      },
    });
  }
}
