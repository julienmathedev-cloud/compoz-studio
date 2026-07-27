/**
 * @file packages/ui/src/site/skins/portfolio/cells/testimonials-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for testimonials cells.
 */

import type { SiteTestimonialsUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioTestimonialsUi: SiteTestimonialsUiOverride = {
  card: "border-border/80 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:border-primary/30",
} as const;
