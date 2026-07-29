/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Use case that updates a section block on a draft page.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { applySectionBlockPatch } from "@compoz/core/domain/pages/use-cases/blocks/helpers/apply-section-block-patch";
import type {
  UpdateSectionBlockDeps,
  UpdateSectionBlockInput,
  UpdateSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

export function updateSectionBlock({
  pages,
  nowIso = () => new Date().toISOString(),
}: UpdateSectionBlockDeps) {
  return async function run(
    input: UpdateSectionBlockInput,
  ): Promise<UpdateSectionBlockResult> {
    const pageId = String(input.pageId ?? "").trim();
    const blockId = String(input.blockId ?? "").trim();
    const patch =
      input.patch && typeof input.patch === "object" ? input.patch : null;

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

    if (!patch) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["patch"] },
      });
    }

    await pages.ensureBase();

    const pageRead = await pages.readByIdWithRevisions(
      DEFAULT_CONTENT_STATE,
      pageId,
    );
    if (!pageRead) {
      throw new DomainError({
        code: EC.PAGE_NOT_FOUND,
        message: EC.PAGE_NOT_FOUND,
        details: {
          path: ["pageId"],
          meta: { pageId, state: DEFAULT_CONTENT_STATE },
        },
      });
    }

    const page = pageRead.page;
    const currentBlocks = Array.isArray(page.blocks) ? page.blocks : [];
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

    const current = currentBlocks[index];

    if (current.type !== "section") {
      throw new DomainError({
        code: EC.BLOCK_TYPE_UNSUPPORTED,
        message: EC.BLOCK_TYPE_UNSUPPORTED,
        details: {
          path: ["blocks", index, "type"],
          meta: { type: current.type },
        },
      });
    }

    const next = applySectionBlockPatch(current, patch);

    let nextBlocks = [...currentBlocks];

    /** Only one section can own LCP priority; enabling it on this block disables it on the others. */
    if (patch.lcpPriority === true) {
      nextBlocks = nextBlocks.map((block) =>
        block.type === "section" ? { ...block, lcpPriority: false } : block,
      );
    }

    nextBlocks[index] = next;

    assertBlocks(nextBlocks);

    const metaUpdatedAt = nowIso();
    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: {
        ...page.meta,
        updatedAt: metaUpdatedAt,
      },
    };

    await pages.updateDraftPageBlocks({
      pageId,
      blocks: nextBlocks,
      blocksRevision: pageRead.revisions.blocksRevision,
      metaUpdatedAt,
    });

    return {
      page: nextPage,
      block: next,
      blocks: nextBlocks,
    };
  };
}
