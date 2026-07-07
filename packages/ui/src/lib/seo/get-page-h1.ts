/**
 * @file packages/ui/src/lib/seo/get-page-h1.ts
 * @layer ui/lib/seo
 * @description Extracts the first H1 from page blocks for SEO fallbacks, warnings, and admin preview.
 */

import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export function getPageH1(blocks: readonly BlockShape[]): string | undefined {
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
