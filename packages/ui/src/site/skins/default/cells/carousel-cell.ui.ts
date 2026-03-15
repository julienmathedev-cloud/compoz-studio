/**
 * @file packages/ui/src/site/skins/default/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — carousel block (Default).
 *
 * @remarks
 * - ✅ Ici vit TOUT le style :
 *   - structure fill (relative/overflow)
 *   - ratio (aspect-video) pour mode "ratio"
 *   - image stacking (absolute/inset-0)
 *   - transition (duration/transition-opacity)
 *   - object-fit
 */

import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";
import { defaultCaseStudyCardUi } from "@compoz/ui/site/skins/default/cells/case-study-card-cell.ui";

export const defaultCarouselUi: SiteCarouselUi = {
  carousel: {
    root: "relative w-full",
    viewport: "relative overflow-hidden rounded-xl",
    track: "relative min-h-[280px] sm:min-h-[360px] md:min-h-[420px]",
    slide: "absolute inset-0 tr-opacity",
    slideActive: "z-10 opacity-100",
    slideInactive: "pointer-events-none z-0 opacity-0",
    arrowButton:
      "absolute top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-primary bg-background shadow-md sm:inline-flex",
    arrowIcon: "h-5 w-5",
    dots: "mt-6 flex justify-center gap-2",
    dot: "h-2 w-2 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-muted-foreground/30",
  },

  slider: {
    root: "relative px-4 sm:px-8 md:px-12",
    track: "cursor-grab active:cursor-grabbing",
    slide:
      "mt-4 mb-4 flex justify-center tr-opacity tr-transform tr-shadow outline-none",
    slideActive: "opacity-100 translate-y-0",
    slideInactive: "opacity-40 translate-y-2 shadow-none",
    arrowButton:
      "absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-primary bg-background shadow-md sm:inline-flex",
    arrowIcon: "h-5 w-5",
    dots: "mt-6 flex justify-center gap-2",
    dot: "h-2 w-2 rounded-full p-0 transition-colors cursor-pointer",
    dotActive: "bg-primary",
    dotInactive: "bg-muted-foreground/30",
  },

  imageItem: {
    ratioContainer: "relative aspect-[16/9] w-full overflow-hidden rounded-xl",
    fillContainer:
      "relative min-h-[320px] w-full overflow-hidden rounded-xl sm:min-h-[420px] md:min-h-[520px]",
    image: "object-cover",
  },

  contentItem: {
    active: "w-full max-w-5xl py-0.5",
    inactive: "w-full max-w-5xl py-0.5",
  },

  caseStudyCard: defaultCaseStudyCardUi,
} as const;
