/**
 * @file packages/ui/src/site/skins/default/blocks/carousel-block.ui.ts
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

export const defaultCarouselUi: SiteCarouselUi = {
  // ✅ Mode ratio : structure + ratio
  containerRatio: "relative w-full overflow-hidden aspect-video",

  // ✅ Mode fill : structure + hero height (PAS de aspect-video)
  containerFill:
    "relative w-full overflow-hidden h-[calc(100svh-var(--header-h,0px))]",

  // ✅ Images : stacking + transition (PRM safe) + cover + taille
  image:
    "absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-700",
} as const;
