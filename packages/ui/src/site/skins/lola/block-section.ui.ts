/**
 * @file packages/ui/src/site/skins/lola/block-section.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — block sections (thème lola).
 *
 * @remarks
 * - Définit le container (contained/fullBleed) et la grille.
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteBlockSectionUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaBlockSectionUi: SiteBlockSectionUiOverride = {
  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24",
    3: "grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12",
  },
} as const;
