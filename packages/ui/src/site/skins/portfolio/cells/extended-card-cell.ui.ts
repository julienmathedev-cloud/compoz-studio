/**
 * @file packages/ui/src/site/skins/portfolio/cells/extended-card-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for extended card cells.
 */

import type { SiteExtendedCardUiOverride } from "@compoz/ui/site/site-ui.types";
import { cardGhostButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioExtendedCardUi: SiteExtendedCardUiOverride = {
  card: "hover-pulse-trigger border-border/80 bg-card/70 shadow-xs motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary/40 motion-safe:hover:bg-primary/2",

  eyebrow: "text-primary text-xs",

  iconContainer:
    "flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5",

  icon: "icon-hover-pulse h-5 w-5 text-primary",

  bulletsList: "mt-3",

  footer: "text-primary",

  button: cardGhostButtonClass,
} as const;
