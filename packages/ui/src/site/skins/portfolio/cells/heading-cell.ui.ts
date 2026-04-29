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
    "inline-block text-primary md:bg-gradient-to-r md:from-primary md:via-primary/50 md:to-primary md:bg-[length:200%_100%] md:bg-clip-text md:text-transparent md:animate-highlight-shift",
} as const;
