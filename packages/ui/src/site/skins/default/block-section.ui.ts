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
  containerContained: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6",
  containerFullBleed: "h-full w-full",

  sectionSpacingContained: "py-6 md:py-12 lg:py-18",

  // Espacement entre les rows d’un même block
  rows: "space-y-6 md:space-y-8",

  // Base de la row
  grid: "grid",

  // Espacement entre colonnes
  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid-cols-1 md:grid-cols-3 gap-3 md:gap-4",
  },

  // Espacement entre les cells dans une colonne
  column: "flex min-w-0 flex-col gap-3 md:gap-4",

  cell: "min-w-0",
  backgroundOdd: "",
  backgroundEven: "",
} as const;
