/**
 * @file packages/ui/src/site/skins/lola/block-section.ui.ts
 * @layer ui/site/skins/lola
 *
 * @description
 * Defines the Lola skin overrides for public site block sections.
 */

import type { SiteBlockSectionUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaBlockSectionUi: SiteBlockSectionUiOverride = {
  sectionSpacingContained: "py-4 md:py-6 lg:py-8",
  rows: "space-y-1 md:space-y-2 lg:space-y-2",
  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 lg:gap-16",
    3: "grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 lg:gap-10",
  },
} as const;
