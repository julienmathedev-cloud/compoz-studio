/**
 * @file packages/core/src/domain/pages/use-cases/blocks/helpers/apply-section-block-patch.ts
 * @layer core/domain/pages/use-cases/blocks/helpers
 * @description
 * Helper pur appliquant un patch contrôlé sur un block `Section`.
 *
 * @remarks
 * - Ne contient aucune lecture/écriture repository.
 * - Ne contient aucune validation métier globale (faite par les validators du domaine).
 * - Les champs absents dans le patch restent inchangés.
 */

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import type { SectionBlockPatch } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";

/**
 * Applique un patch partiel sur un block `Section`.
 */
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
