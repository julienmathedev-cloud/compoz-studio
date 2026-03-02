/**
 * @file packages/ui/src/site/skins/default/layout-section.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — layout sections (thème Default).
 *
 * @remarks
 * - Définit le container (contained/fullBleed) et la grille.
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { PublicLayoutSectionUi } from "@compoz/ui/site/public-ui.types";

export const defaultLayoutSectionUi: PublicLayoutSectionUi = {
  // ✅ Canonique : même cadre que header/footer
  containerContained: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6",

  // Full bleed : sort du cadre, mais garde un rythme vertical
  containerFullBleed: "w-full",

  // Grid : plus de inline → gap ici
  grid: "grid gap-6",

  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-12",
    3: "grid-cols-1 md:grid-cols-3 gap-8",
  },

  cell: "min-w-0",
} as const;
