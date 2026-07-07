/**
 * @file packages/ui/src/site/skins/portfolio/cells/carousel-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for carousel and slider cells.
 */

import type { SiteCarouselUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";
import { portfolioCardUi } from "@compoz/ui/site/skins/portfolio/cells/card-cell.ui";
import { portfolioExtendedCardUi } from "@compoz/ui/site/skins/portfolio/cells/extended-card-cell.ui";
import { portfolioStructuredCardUi } from "@compoz/ui/site/skins/portfolio/cells/structured-card-cell.ui";

export const portfolioCarouselUi: SiteCarouselUiOverride = {
  carousel: {
    arrowButton:
      portfolioButtonClass +
      " md:scale-120 motion-safe:md:hover:scale-124 motion-safe:md:active:scale-116 lg:scale-140 motion-safe:lg:hover:scale-148 motion-safe:lg:active:scale-138",
  },

  slider: {
    slide:
      "motion-safe:transition-[opacity] motion-safe:duration-300 motion-safe:ease-out",
    slideActive: "translate-y-0",
    slideInactive: "opacity-93 translate-y-2 shadow-none",
    arrowButton:
      portfolioButtonClass +
      " md:scale-120 motion-safe:md:hover:scale-124 motion-safe:md:active:scale-116 lg:scale-140 motion-safe:lg:hover:scale-148 motion-safe:lg:active:scale-138",
  },

  card: portfolioCardUi,
  extendedCard: portfolioExtendedCardUi,
  structuredCard: portfolioStructuredCardUi,
} as const;
