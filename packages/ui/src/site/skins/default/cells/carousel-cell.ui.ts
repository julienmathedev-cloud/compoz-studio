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

    viewportFullBleed:
      "relative overflow-hidden h-[calc(100dvh-var(--header-h,64px))]",
    track: "relative h-full",
    slide:
      "absolute h-full w-full inset-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out",
    slideActive: "z-10 opacity-100",
    slideInactive: "pointer-events-none z-0 opacity-0",
    arrowButton:
      "absolute top-1/2 z-20 hidden h-8 w-8 rounded-full sm:inline-flex cursor-pointer",
    arrowIcon: "h-8 w-8",
    dots: "pt-4 flex justify-center gap-2",
    dot: "h-4 w-4 md:h-3 md:w-3 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-primary/30",
  },

  slider: {
    root: "relative",
    track: "cursor-grab active:cursor-grabbing",
    slide: "mt-4 mb-4 flex justify-center outline-none",
    slideActive: "opacity-100 p-2",
    slideInactive: "opacity-93 p-2",
    arrowButton:
      "absolute top-9/20 z-20 hidden h-8 w-8 rounded-full sm:inline-flex cursor-pointer",
    arrowIcon: "h-8 w-8",
    dots: "flex justify-center gap-2",
    dot: "h-4 w-4 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-primary/30",
  },

  imageItem: {
    ratioContainer: "relative aspect-[16/9] bg-muted",
    fillContainer: "relative w-full h-full",
    containedImage: "object-contain",
    coverImage: "object-cover",
    caption: "pt-3 text-center text-sm text-muted-foreground",
  },

  imageItemSlider: {
    ratioContainer: "relative w-full bg-muted max-h-[70vh] flex justify-center",
    fillContainer: "relative w-full",
    containedImage: "h-auto max-h-[70vh] w-auto max-w-full object-contain",
    coverImage: "h-auto max-h-[70vh] w-full object-cover",
    caption: "pt-3 text-center text-sm text-muted-foreground",
  },

  contentItem: {
    active: "mx-auto w-full max-w-4xl py-0.5",
    inactive: "mx-auto w-full max-w-4xl py-0.5",
  },
  card: defaultCardsUi,
  extendedCard: defaultCardsExtendedUi,
  structuredCard: defaultStructuredCardUi,
} as const;
