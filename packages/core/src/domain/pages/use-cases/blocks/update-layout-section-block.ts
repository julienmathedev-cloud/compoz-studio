/**
 * @file packages/core/src/domain/pages/use-cases/blocks/update-layout-section-block.ts
 * @layer core/domain
 * @description
 * Use-case de mise à jour d’un block `LayoutSection` sur une page (édition admin → draft/published selon `state`).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { LayoutSectionBlock } from "@compoz/core/domain/pages/entities/block";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

import type {
  LayoutSectionBlockPatch,
  UpdateLayoutSectionBlockDeps,
  UpdateLayoutSectionBlockInput,
  UpdateLayoutSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/update-layout-section-block.types";

export function updateLayoutSectionBlock({
  pages,
}: UpdateLayoutSectionBlockDeps) {
  return async function run(
    input: UpdateLayoutSectionBlockInput,
  ): Promise<UpdateLayoutSectionBlockResult> {
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

    const currentBlocks = Array.isArray(page.blocks) ? page.blocks : [];
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

    const next = applyPatch(current, input.patch);

    let nextBlocks = [...currentBlocks];

    // Si le patch active LCP → désactiver les autres
    if (input.patch.lcpPriority === true) {
      nextBlocks = nextBlocks.map((b) =>
        b.type === "layoutSection" ? { ...b, lcpPriority: false } : b,
      );
    }

    // Injecter la version mise à jour
    nextBlocks[index] = next;

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: { ...page.meta, updatedAt: new Date().toISOString() },
    };

    await pages.put(WRITE_CONTENT_STATE, nextPage);

    return { page: nextPage, block: next, blocks: nextBlocks };
  };
}

/* -------------------------------------------------------------------------- */
/*                               Inline helpers                               */
/* -------------------------------------------------------------------------- */
function applyPatch(
  block: LayoutSectionBlock,
  patch: LayoutSectionBlockPatch,
): LayoutSectionBlock {
  const nextColumns =
    typeof patch.columns === "number" ? patch.columns : block.layout.columns;

  const nextTitle =
    "title" in patch ? (patch.title ?? block.title) : block.title;

  const nextTitleEnabled =
    typeof patch.titleEnabled === "boolean"
      ? patch.titleEnabled
      : block.titleEnabled;

  const nextLcpPriority =
    typeof patch.lcpPriority === "boolean"
      ? patch.lcpPriority
      : block.lcpPriority;

  const nextContainerMode =
    "containerMode" in patch && patch.containerMode !== undefined
      ? patch.containerMode
      : block.containerMode;

  const cells = Array.isArray(patch.cells) ? patch.cells : block.cells;

  return {
    ...block,
    layout: { columns: nextColumns },
    containerMode: nextContainerMode,
    titleEnabled: nextTitleEnabled,
    title: nextTitle,
    lcpPriority: nextLcpPriority,
    cells,
  };
}
