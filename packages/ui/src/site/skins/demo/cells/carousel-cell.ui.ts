/**
 * @file packages/ui/src/site/skins/demo/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — carousel block (thème Démo).
 */

import type { SiteCarouselUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoCardUi } from "@compoz/ui/site/skins/demo/cells/card-cell.ui";
import { demoExtendedCardUi } from "@compoz/ui/site/skins/demo/cells/extended-card-cell.ui";
import { demoStructuredCardUi } from "@compoz/ui/site/skins/demo/cells/structured-card-cell.ui";

export const demoCarouselUi: SiteCarouselUiOverride = {
  carousel: {
    arrowButton: "scale-120 md:scale-120 lg:scale-140",
  },

  slider: {
    slide:
      "motion-safe:transition-[opacity] motion-safe:duration-200 motion-safe:ease-out",
    slideActive: "translate-y-0",
    slideInactive: "opacity-93 translate-y-2 shadow-none",
    arrowButton: "scale-120 md:scale-120 lg:scale-140",
  },
  card: demoCardUi,
  extendedCard: demoExtendedCardUi,
  structuredCard: demoStructuredCardUi,
} as const;
