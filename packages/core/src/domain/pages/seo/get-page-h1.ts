/**
 * @file packages/core/src/domain/pages/seo/get-page-h1.ts
 * @layer core/domain/pages/seo
 * @description Extrait le premier H1 d’une page à partir des blocks domaine.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";

export function getPageH1FromBlocks(
  blocks: readonly Block[],
): string | undefined {
  for (const block of blocks) {
    for (const row of block.rows ?? []) {
      for (const column of row.columns ?? []) {
        for (const cell of column.cells ?? []) {
          if (cell.kind === "heading" && cell.level === "h1") {
            const text = (cell.title ?? "").trim();
            if (text) return text;
          }
        }
      }
    }
  }

  return undefined;
}
