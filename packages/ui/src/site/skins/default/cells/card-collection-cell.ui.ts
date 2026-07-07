/**
 * @file packages/ui/src/site/skins/default/cells/card-collection-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin layout classes for card collection cells.
 */

import type { SiteCardCollectionUi } from "@compoz/ui/site/site-ui.types";

export const defaultCardCollectionUi: SiteCardCollectionUi = {
  root: "w-full",
  grid: "grid gap-6",
  columns: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  },
  align: {
    left: "text-left",
    center: "text-center",
  },
  item: "h-full",
} as const;
