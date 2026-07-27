/**
 * @file packages/ui/src/site/skins/portfolio/cells/steps-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for steps cells.
 */

import type { SiteStepsUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioStepsUi: SiteStepsUiOverride = {
  card: {
    root: "border-border/80 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:border-primary/30",

    badge: "border-primary bg-primary text-primary-foreground",
  },
} as const;
