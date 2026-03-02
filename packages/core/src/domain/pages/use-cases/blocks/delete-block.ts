/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.ts
 * @layer core/domain
 * @description
 * Use-case de suppression d’un block sur une page (édition admin → draft).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

import type {
  DeleteBlockDeps,
  DeleteBlockInput,
  DeleteBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/delete-block.types";

export function deleteBlock({ pages }: DeleteBlockDeps) {
  return async function run(
    input: DeleteBlockInput,
  ): Promise<DeleteBlockResult> {
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
    const index = currentBlocks.findIndex((b) => b.id === input.blockId);

    if (index < 0) {
      throw new DomainError({
        code: EC.BLOCK_NOT_FOUND,
        message: EC.BLOCK_NOT_FOUND,
        details: {
          path: ["blockId"],
          meta: { blockId: input.blockId, pageId: input.pageId },
        },
      });
    }

    const nextBlocks: Block[] = currentBlocks.filter(
      (b) => b.id !== input.blockId,
    );

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
