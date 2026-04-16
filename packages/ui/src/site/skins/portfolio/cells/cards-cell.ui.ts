/**
 * @file packages/ui/src/site/skins/portoflio/cells/cards-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — cards cell (thème Portfolio).
 */

import type { SiteCardsUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioCardsUi: SiteCardsUiOverride = {
  card: "hover-pulse-trigger motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary",
  icon: "icon-hover-pulse",
} as const;
