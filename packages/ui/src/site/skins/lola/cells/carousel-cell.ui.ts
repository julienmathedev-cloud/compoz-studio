/**
 * @file packages/ui/src/site/skins/lola/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — carousel block (thème Lola).
 */

import type { SiteCarouselUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaCarouselUi: SiteCarouselUiOverride = {
  carousel: {
    arrowButton: "bg-primary/40",
    dotActive: "bg-primary/40 border-primary",
    dotInactive: "bg-primary/20 border-primary/80",
  },
  slider: {
    arrowButton: "bg-primary/40",
    dotActive: "bg-primary/40 border-primary",
    dotInactive: "bg-primary/20 border-primary/80",
  },
  imageItemSlider: {
    containedImage: "rounded-xl",
    coverImage: "rounded-xl",
  },
} as const;
