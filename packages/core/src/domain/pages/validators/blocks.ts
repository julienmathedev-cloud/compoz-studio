/**
 * @file src/core/domain/pages/validators/blocks.ts
 * @layer core/domain
 * @description
 * Invariants métier **bloquants** applicables aux blocks d’une page (V0.5).
 *
 * @remarks
 * - Validation stricte du domaine uniquement.
 * - Pas de normalisation ici (gérée par les use-cases).
 * - Les warnings non bloquants sont traités côté UI.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import { assertCell } from "@compoz/core/domain/pages/validators/cells";

/**
 * Vérifie les invariants métier d’une liste de blocks.
 *
 * @throws DomainError
 */
export function assertBlocks(blocks: Block[]): void {
  if (!Array.isArray(blocks)) {
    throw new DomainError({
      code: EC.BLOCKS_INVALID,
      message: EC.BLOCKS_INVALID,
      details: { path: ["blocks"] },
    });
  }

  const seenIds = new Set<string>();
  let lcpCount = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    // ---------------------------------------------------------------------
    // invariants génériques
    // ---------------------------------------------------------------------

    const id = block.id?.trim?.() ?? "";
    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_ID_REQUIRED,
        message: EC.BLOCK_ID_REQUIRED,
        details: { path: ["blocks", i, "id"] },
      });
    }

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_ID_DUPLICATE,
        message: EC.BLOCK_ID_DUPLICATE,
        details: { path: ["blocks", i, "id"], meta: { id } },
      });
    }
    seenIds.add(id);

    if (block.lcpPriority === true) {
      lcpCount += 1;

      if (lcpCount > 1) {
        throw new DomainError({
          code: EC.BLOCKS_MULTIPLE_LCP_DETECTED,
          message: EC.BLOCKS_MULTIPLE_LCP_DETECTED,
          details: { path: ["blocks"], meta: { lcpCount } },
        });
      }
    }

    // ---------------------------------------------------------------------
    // invariants spécifiques V0.5 : LayoutSectionBlock uniquement
    // ---------------------------------------------------------------------

    if (block.type !== "layoutSection") {
      throw new DomainError({
        code: EC.BLOCK_TYPE_UNSUPPORTED,
        message: EC.BLOCK_TYPE_UNSUPPORTED,
        details: {
          path: ["blocks", i, "type"],
          meta: { type: (block as { type?: unknown }).type },
        },
      });
    }

    const { layout, cells, containerMode } = block;

    if (!layout || ![1, 2, 3].includes(layout.columns)) {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_COLUMNS_INVALID,
        message: EC.LAYOUT_SECTION_COLUMNS_INVALID,
        details: { path: ["blocks", i, "layout", "columns"] },
      });
    }

    if (containerMode !== "contained" && containerMode !== "fullBleed") {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_CONTAINER_MODE_INVALID,
        message: EC.LAYOUT_SECTION_CONTAINER_MODE_INVALID,
        details: { path: ["blocks", i, "containerMode"] },
      });
    }

    if (!Array.isArray(cells)) {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_CELLS_INVALID,
        message: EC.LAYOUT_SECTION_CELLS_INVALID,
        details: { path: ["blocks", i, "cells"] },
      });
    }

    if (cells.length !== layout.columns) {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_CELLS_COUNT_MISMATCH,
        message: EC.LAYOUT_SECTION_CELLS_COUNT_MISMATCH,
        details: {
          path: ["blocks", i, "cells"],
          meta: { expected: layout.columns, actual: cells.length },
        },
      });
    }

    // ---------------------------------------------------------------------
    // title (V0.5) — désormais ALWAYS present + toggled via titleEnabled
    // ---------------------------------------------------------------------

    if (typeof block.titleEnabled !== "boolean") {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_TITLE_DISPLAY_INVALID,
        message: EC.LAYOUT_SECTION_TITLE_DISPLAY_INVALID,
        details: { path: ["blocks", i, "titleEnabled"] },
      });
    }

    const title = block.title;

    if (!title || typeof title !== "object") {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_TITLE_REQUIRED,
        message: EC.LAYOUT_SECTION_TITLE_REQUIRED,
        details: { path: ["blocks", i, "title"] },
      });
    }

    const titleObj = title;

    const text = typeof titleObj.text === "string" ? titleObj.text : "";
    const display = titleObj.display;

    if (display !== "visible" && display !== "sr-only") {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_TITLE_DISPLAY_INVALID,
        message: EC.LAYOUT_SECTION_TITLE_DISPLAY_INVALID,
        details: { path: ["blocks", i, "title", "display"] },
      });
    }

    // ✅ Si le titre est activé, il doit être non vide.
    if (block.titleEnabled && text.trim().length === 0) {
      throw new DomainError({
        code: EC.LAYOUT_SECTION_TITLE_REQUIRED,
        message: EC.LAYOUT_SECTION_TITLE_REQUIRED,
        details: { path: ["blocks", i, "title", "text"] },
      });
    }

    for (let j = 0; j < cells.length; j += 1) {
      assertCell(cells[j], ["blocks", i, "cells", j]);
    }
  }
}
