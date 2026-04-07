/**
 * @file packages/ui/src/site/skins/default/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — carousel block (Default).
 */

import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";
import { defaultCardsUi } from "@compoz/ui/site/skins/default/cells/cards-cell.ui";
import { defaultCardsExtendedUi } from "@compoz/ui/site/skins/default/cells/cards-extended-cell.ui";
import { defaultStructuredCardUi } from "@compoz/ui/site/skins/default/cells/structured-card-cell.ui";

export const defaultCarouselUi: SiteCarouselUi = {
  carousel: {
    root: "relative w-full",
    viewport: "relative overflow-hidden rounded-xl aspect-[16/9]",
    track: "",
    slide: "absolute inset-0 tr-opacity",
    slideActive: "z-10 opacity-100",
    slideInactive: "pointer-events-none z-0 opacity-0",
    arrowButton:
      "absolute top-1/2 z-20 h-8 w-8 hidden rounded-full sm:inline-flex scale-120 md:scale-120 lg:scale-140",
    arrowIcon: "h-8 w-8",
    dots: "mt-6 flex justify-center gap-2",
    dot: "h-2.5 w-2.5 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-primary/30",
  },

  slider: {
    root: "relative",
    track: "cursor-grab active:cursor-grabbing",
    slide:
      "mt-4 mb-4 flex justify-center tr-opacity tr-transform tr-shadow outline-none",
    slideActive: "opacity-100 translate-y-0 p-1",
    slideInactive: "opacity-40 translate-y-2 shadow-none p-1",
    arrowButton:
      "absolute top-9/20 z-20 h-8 w-8 hidden rounded-full sm:inline-flex scale-120 md:scale-120 lg:scale-140",
    arrowIcon: "h-8 w-8",
    dots: "mt-6 flex justify-center gap-2",
    dot: "h-2.5 w-2.5 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-primary/30",
  },

  imageItem: {
    ratioContainer: "relative aspect-[16/9]",
    fillContainer: "relative w-full h-full",
    image: "object-cover",
  },

  contentItem: {
    active: "mx-auto w-full max-w-4xl py-0.5",
    inactive: "mx-auto w-full max-w-4xl py-0.5",
  },
  card: defaultCardsUi,
  extendedCard: defaultCardsExtendedUi,
  structuredCard: defaultStructuredCardUi,
} as const;
