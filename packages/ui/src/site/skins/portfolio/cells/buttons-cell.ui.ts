/**
 * @file packages/ui/src/site/skins/portfolio/cells/buttons-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — buttons cell (thème Portfolio).
 */

import type { SiteButtonsUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioButtonClass =
  "min-h-12 rounded-xl px-6 py-3 text-sm font-bold border border-transparent shadow-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:translate-y-[-1px] motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98] hover:shadow-md motion-safe:hover:border-primary data-[variant=default]:bg-primary data-[variant=default]:text-primary-foreground data-[variant=default]:hover:bg-primary/90 data-[variant=default]:hover:text-primary-foreground";

export const portfolioButtonsUi: SiteButtonsUiOverride = {
  button: portfolioButtonClass,
} as const;
