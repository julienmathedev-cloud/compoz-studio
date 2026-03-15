/**
 * @file packages/ui/src/site/skins/default/cells/cards-extended-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — cards extended cell (thème Default).
 */

import type { SiteCardsExtendedUi } from "@compoz/ui/site/site-ui.types";

export const defaultCardsExtendedUi: SiteCardsExtendedUi = {
  root: "w-full",

  grid: "grid gap-6",

  columns: {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
  },
} as const;
