/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-layout-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Use-case : mise à jour d’un block `LayoutSection` sur une page (écriture dans l’état par défaut).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { applyPatch } from "@compoz/core/domain/pages/use-cases/blocks/helpers/apply-blocks-patch";
import type {
  UpdateLayoutSectionBlockDeps,
  UpdateLayoutSectionBlockInput,
  UpdateLayoutSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/update-layout-section-block.types";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

export function updateLayoutSectionBlock({
  pages,
  nowIso = () => new Date().toISOString(),
}: UpdateLayoutSectionBlockDeps) {
  return async function run(
    input: UpdateLayoutSectionBlockInput,
  ): Promise<UpdateLayoutSectionBlockResult> {
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
    if (current.type !== "layoutSection") {
      throw new DomainError({
        code: EC.BLOCK_TYPE_UNSUPPORTED,
        message: EC.BLOCK_TYPE_UNSUPPORTED,
        details: {
          path: ["blocks", index, "type"],
          meta: { type: current.type },
        },
      });
    }

    const next = applyPatch(current, patch);

    let nextBlocks = [...currentBlocks];

    // Si le patch active LCP → désactiver les autres
    if (patch.lcpPriority === true) {
      nextBlocks = nextBlocks.map((b) =>
        b.type === "layoutSection" ? { ...b, lcpPriority: false } : b,
      );
    }

    nextBlocks[index] = next;

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: { ...page.meta, updatedAt: nowIso() },
    };

    await pages.put(DEFAULT_CONTENT_STATE, nextPage);

    return { page: nextPage, block: next, blocks: nextBlocks };
  };
}
