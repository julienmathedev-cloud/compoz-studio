/**
 * @file packages/ui/src/site/skins/portfolio/block-section.ui.ts
 * @layer ui/site/skins/portfolio
 *
 * @description
 * Defines the portfolio skin overrides for public site block sections.
 */

import type { SiteBlockSectionUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioBlockSectionUi: SiteBlockSectionUiOverride = {
  sectionSpacingContained: "py-6 md:py-8 lg:py-12",
} as const;
