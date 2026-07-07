/**
 * @file packages/core/src/domain/pages/use-cases/blocks/helpers/apply-section-block-patch.ts
 * @layer core/domain/pages/use-cases/blocks/helpers
 * @description Pure helper that applies a controlled patch to a section block.
 * @remarks
 * Missing patch fields preserve the current block values. Repository access and global domain validation are handled outside this helper.
 */

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import type { SectionBlockPatch } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";

export function applySectionBlockPatch(
  block: SectionBlock,
  patch: SectionBlockPatch,
): SectionBlock {
  return {
    ...block,
    name: typeof patch.name === "string" ? patch.name.trim() : block.name,
    containerMode: patch.containerMode ?? block.containerMode,
    cssClassName:
      typeof patch.cssClassName === "string"
        ? patch.cssClassName.trim() || undefined
        : block.cssClassName,
    lcpPriority:
      typeof patch.lcpPriority === "boolean"
        ? patch.lcpPriority
        : block.lcpPriority,
    rows: Array.isArray(patch.rows) ? patch.rows : block.rows,
  };
}
