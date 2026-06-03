/**
 * @file packages/ui/src/site/skins/lola/cells/carousel-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — carousel block (thème Lola).
 */

import type { SiteCarouselUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaCarouselUi: SiteCarouselUiOverride = {
  imageItemSlider: {
    ratioContainer: "bg-background",
  },
} as const;
