/**
 * @file packages/core/src/domain/pages/use-cases/blocks/add-layout-section-block.ts
 * @layer core/domain
 * @description
 * Use-case d’ajout d’un block `LayoutSection` sur une page (édition admin → draft/published selon `state`).
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { LayoutSectionBlock } from "@compoz/core/domain/pages/entities/block";
import type {
  AddLayoutSectionBlockDeps,
  AddLayoutSectionBlockInput,
  AddLayoutSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/add-layout-section-block.types";

import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";

export function addLayoutSectionBlock({ pages }: AddLayoutSectionBlockDeps) {
  return async function run(
    input: AddLayoutSectionBlockInput,
  ): Promise<AddLayoutSectionBlockResult> {
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

    const insertAt =
      typeof input.insertAt === "number"
        ? input.insertAt
        : currentBlocks.length;

    assertInsertAt({ insertAt, size: currentBlocks.length });

    const block: LayoutSectionBlock = {
      id: generateBlockId(),
      type: "layoutSection",
      layout: { columns: input.columns },
      containerMode: input.containerMode,
      titleEnabled: input.titleEnabled,
      title: {
        text: input.title.text.trim(),
        display: input.title.display,
      },
      lcpPriority: input.lcpPriority,
      cells: input.cells,
    };

    let nextBlocks = [...currentBlocks];

    // Si le nouveau block est LCP → on désactive les autres
    if (input.lcpPriority) {
      nextBlocks = nextBlocks.map((b) =>
        b.type === "layoutSection" ? { ...b, lcpPriority: false } : b,
      );
    }

    nextBlocks.splice(insertAt, 0, block);

    // Invariants bloquants : ids uniques, layout valide, cells cohérentes, etc.
    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: { ...page.meta, updatedAt: new Date().toISOString() },
    };

    await pages.put(WRITE_CONTENT_STATE, nextPage);

    return { page: nextPage, block, blocks: nextBlocks };
  };
}

/* -------------------------------------------------------------------------- */
/*                               Inline helpers                               */
/* -------------------------------------------------------------------------- */

type AssertInsertAtProps = {
  insertAt: number;
  size: number;
};

function assertInsertAt({ insertAt, size }: AssertInsertAtProps): void {
  if (insertAt < 0 || insertAt > size) {
    throw new DomainError({
      code: EC.BLOCKS_INVALID,
      message: EC.BLOCKS_INVALID,
      details: { path: ["insertAt"], meta: { insertAt, size } },
    });
  }
}

function generateBlockId(): string {
  return `blk_${crypto.randomUUID()}`;
}
