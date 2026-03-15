/**
 * @file packages/ui/src/site/skins/default/cells/cards-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — cards cell (thème Default).
 */

import type { SiteCardsUi } from "@compoz/ui/site/site-ui.types";

export const defaultCardsUi: SiteCardsUi = {
  root: "w-full",

  grid: "grid gap-6",

  columns: {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  },
} as const;
