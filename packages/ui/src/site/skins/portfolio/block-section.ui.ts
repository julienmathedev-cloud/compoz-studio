/**
 * @file packages/ui/src/site/skins/portfolio/block-section.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — block sections (thème Portfolio).
 *
 * @remarks
 * - Définit le container (contained/fullBleed) et la grille.
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteBlockSectionUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioBlockSectionUi: SiteBlockSectionUiOverride = {
  backgroundOdd:
    "bg-gradient-to-br from-primary/20 via-background to-transparent",
  backgroundEven:
    "bg-gradient-to-tr from-primary/20 via-background to-transparent",
} as const;
