/**
 * @file packages/core/src/domain/pages/use-cases/blocks/helpers/apply-blocks-patch.ts
 * @layer core/domain/pages/use-cases/blocks/helpers
 * @description
 * Helpers pour l’utilisation de `applyPatch` sur les blocks.
 */

import type { LayoutSectionBlock } from "@compoz/core/domain/pages/entities/block";
import type { LayoutSectionBlockPatch } from "@compoz/core/domain/pages/use-cases/blocks/update-layout-section-block.types";

export function applyPatch(
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
    patch.containerMode !== undefined
      ? patch.containerMode
      : block.containerMode;

  const nextCells = Array.isArray(patch.cells) ? patch.cells : block.cells;

  return {
    ...block,
    layout: { columns: nextColumns },
    containerMode: nextContainerMode,
    titleEnabled: nextTitleEnabled,
    title: nextTitle,
    lcpPriority: nextLcpPriority,
    cells: nextCells,
  };
}
