/**
 * @file packages/ui/src/site/skins/default/block-section.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — block sections (thème Default).
 *
 * @remarks
 * - Définit le container (contained/fullBleed) et la grille.
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteBlockSectionUi } from "@compoz/ui/site/site-ui.types";

export const defaultBlockSectionUi: SiteBlockSectionUi = {
  // ✅ Canonique : même cadre que header/footer
  containerContained: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6",

  // Full bleed : sort du cadre, mais garde un rythme vertical
  containerFullBleed: "w-full",

  // Grid : plus de inline → gap ici
  grid: "grid",

  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid-cols-1 md:grid-cols-3 gap-4",
  },

  cell: "min-w-0",
} as const;
