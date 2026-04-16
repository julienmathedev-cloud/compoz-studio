/**
 * @file packages/ui/src/site/skins/demo/cells/heading-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — heading cell (thème Démo).
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoHeadingUi: SiteHeadingUiOverride = {
  separatorHero: "bg-primary",
  highlight:
    "bg-gradient-to-l from-primary to-primary/50 bg-clip-text text-transparent",
} as const;
