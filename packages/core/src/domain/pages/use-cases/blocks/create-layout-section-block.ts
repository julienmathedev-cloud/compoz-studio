/**
 * @file packages/core/src/domain/pages/use-cases/blocks/create-layout-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Use-case : ajout d’un block `LayoutSection` sur une page (écriture dans l’état par défaut).
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { LayoutSectionBlock } from "@compoz/core/domain/pages/entities/block";
import type {
  CreateLayoutSectionBlockDeps,
  CreateLayoutSectionBlockInput,
  CreateLayoutSectionBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/create-layout-section-block.types";

import {
  assertBlocks,
  assertInsertAt,
} from "@compoz/core/domain/pages/validators/blocks";

export function createLayoutSectionBlock({
  pages,
  idGenerator,
  nowIso,
}: CreateLayoutSectionBlockDeps) {
  return async function run(
    input: CreateLayoutSectionBlockInput,
  ): Promise<CreateLayoutSectionBlockResult> {
    await pages.ensureBase();

    const page = await pages.readById(DEFAULT_CONTENT_STATE, input.pageId);
    if (!page) {
      throw new DomainError({
        code: EC.PAGE_NOT_FOUND,
        message: EC.PAGE_NOT_FOUND,
        details: {
          path: ["pageId"],
          meta: { pageId: input.pageId, state: DEFAULT_CONTENT_STATE },
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
      id: `blk_${idGenerator.nextId()}`,
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
      meta: {
        ...page.meta,
        updatedAt: nowIso ? nowIso() : new Date().toISOString(),
      },
    };

    await pages.put(DEFAULT_CONTENT_STATE, nextPage);

    return { page: nextPage, block, blocks: nextBlocks };
  };
}
