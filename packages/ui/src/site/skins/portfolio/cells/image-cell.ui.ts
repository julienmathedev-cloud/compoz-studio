/**
 * @file packages/ui/src/site/skins/portfolio/cells/image-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for image cells.
 */

import type { SiteImageUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioImageUi: SiteImageUiOverride = {
  button:
    "group block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  image:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",
  container: "rounded-xl",
} as const;
