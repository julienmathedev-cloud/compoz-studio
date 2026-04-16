/**
 * @file packages/ui/src/site/skins/portfolio/blocks/structured-card-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — structured card cell (thème Portfolio).
 */

import type { SiteStructuredCardUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioStructuredCardUi: SiteStructuredCardUiOverride = {
  card: "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary",
  button: portfolioButtonClass,
} as const;
