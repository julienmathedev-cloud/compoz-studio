/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Use case that reorders blocks on a draft page.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type { Block, BlockId } from "@compoz/core/domain/pages/entities/block";

import {
  assertBlocks,
  assertPermutation,
} from "@compoz/core/domain/pages/validators/blocks";

import type {
  ReorderBlocksDeps,
  ReorderBlocksInput,
  ReorderBlocksResult,
} from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks.types";

export function reorderBlocks({
  pages,
  nowIso = () => new Date().toISOString(),
}: ReorderBlocksDeps) {
  return async function run(
    input: ReorderBlocksInput,
  ): Promise<ReorderBlocksResult> {
    const pageId = String(input.pageId ?? "").trim();

    const orderedBlockIds: BlockId[] = Array.isArray(input.orderedBlockIds)
      ? input.orderedBlockIds
          .map((id) => String(id ?? "").trim())
          .filter(Boolean)
      : [];

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["pageId"] },
      });
    }

    if (orderedBlockIds.length === 0) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["orderedBlockIds"] },
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

    const currentBlocks: ReadonlyArray<Block> = Array.isArray(page.blocks)
      ? page.blocks
      : [];

    const currentIds = currentBlocks.map((b) => b.id);

    assertPermutation({
      ordered: orderedBlockIds,
      current: currentIds,
    });

    const byId = new Map<BlockId, Block>();

    for (const block of currentBlocks) {
      byId.set(block.id, block);
    }

    const nextBlocks: Block[] = orderedBlockIds.map((id) => byId.get(id)!);

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: {
        ...page.meta,
        updatedAt: nowIso(),
      },
    };

    await pages.put(DEFAULT_CONTENT_STATE, nextPage);

    return {
      page: nextPage,
      blocks: nextBlocks,
    };
  };
}
