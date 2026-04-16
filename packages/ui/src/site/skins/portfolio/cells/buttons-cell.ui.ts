/**
 * @file packages/ui/src/site/skins/portfolio/cells/buttons-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — buttons cell (thème Portfolio).
 */

import type { SiteButtonsUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioButtonClass =
  "font-semibold border border-transparent shadow-accent hover:shadow-md motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:translate-y-[-1px] motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98] motion-safe:hover:border-primary data-[variant=default]:shadow-xs data-[variant=default]:hover:bg-accent data-[variant=default]:hover:text-primary";
export const portfolioButtonsUi: SiteButtonsUiOverride = {
  button: portfolioButtonClass,
} as const;
