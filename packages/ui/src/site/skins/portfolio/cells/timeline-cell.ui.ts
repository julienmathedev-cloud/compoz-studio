/**
 * @file packages/ui/src/site/skins/portfolio/cells/timeline-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — timeline cell (thème Portfolio).
 */

import type { SiteTimelineUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioTimelineUi: SiteTimelineUiOverride = {
  triggerButton:
    portfolioButtonClass + " relative h-12 w-12 cursor-pointer rounded-full",
  item: {
    card: "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01]",
  },
} as const;
