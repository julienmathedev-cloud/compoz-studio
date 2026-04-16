/**
 * @file packages/ui/src/site/skins/demo/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — carousel block (thème Démo).
 */

import type { SiteCarouselUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoCardsUi } from "@compoz/ui/site/skins/demo/cells/cards-cell.ui";
import { demoCardsExtendedUi } from "@compoz/ui/site/skins/demo/cells/cards-extended-cell.ui";
import { demoStructuredCardUi } from "@compoz/ui/site/skins/demo/cells/structured-card-cell.ui";

export const demoCarouselUi: SiteCarouselUiOverride = {
  carousel: {
    arrowButton: "scale-120 md:scale-120 lg:scale-140",
  },

  slider: {
    slide:
      "motion-safe:transition-[opacity] motion-safe:duration-200 motion-safe:ease-out",
    slideActive: "translate-y-0",
    slideInactive: "opacity-40 translate-y-2 shadow-none",
    arrowButton: "scale-120 md:scale-120 lg:scale-140",
  },
  card: demoCardsUi,
  extendedCard: demoCardsExtendedUi,
  structuredCard: demoStructuredCardUi,
} as const;
