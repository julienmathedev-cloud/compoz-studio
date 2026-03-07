/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Use-case : suppression d’un block sur une page (écriture dans l’état par défaut).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
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
    const pageId = String(input.pageId ?? "").trim();
    const blockId = String(input.blockId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["pageId"] },
      });
    }
    if (!blockId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["blockId"] },
      });
    }

    await pages.ensureBase();

    const page = await pages.readById(DEFAULT_CONTENT_STATE, pageId);
    if (!page) {
      throw new DomainError({
        code: EC.PAGE_NOT_FOUND,
        message: EC.PAGE_NOT_FOUND,
        details: {
          path: ["pageId"],
          meta: { pageId, state: DEFAULT_CONTENT_STATE },
        },
      });
    }

    const currentBlocks: Block[] = Array.isArray(page.blocks)
      ? page.blocks
      : [];
    const index = currentBlocks.findIndex((b) => b.id === blockId);

    if (index < 0) {
      throw new DomainError({
        code: EC.BLOCK_NOT_FOUND,
        message: EC.BLOCK_NOT_FOUND,
        details: {
          path: ["blockId"],
          meta: { blockId, pageId },
        },
      });
    }

    const nextBlocks = [...currentBlocks];
    nextBlocks.splice(index, 1);

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: { ...page.meta, updatedAt: new Date().toISOString() },
    };

    await pages.put(DEFAULT_CONTENT_STATE, nextPage);

    return { page: nextPage, blocks: nextBlocks };
  };
}
