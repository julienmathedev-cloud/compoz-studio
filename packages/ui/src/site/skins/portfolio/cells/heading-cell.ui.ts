/**
 * @file packages/ui/src/site/skins/portfolio/cells/heading-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — heading cell (thème Default).
 *
 * @remarks
 * Définit uniquement les styles Tailwind.
 * Aucune logique ici : le renderer gère align / level / variant.
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioHeadingUi: SiteHeadingUiOverride = {
  separatorHero: "bg-primary",
  highlight:
    "inline-block bg-gradient-to-r from-primary via-primary/50 to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-highlight-shift",
} as const;
