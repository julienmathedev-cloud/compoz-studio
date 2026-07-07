/**
 * @file packages/ui/src/site/skins/portfolio/cells/heading-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for heading cells.
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioHeadingUi: SiteHeadingUiOverride = {
  level: {
    h1: "w-full text-foreground text-3xl font-black leading-[1.05] tracking-[-0.04em] text-pretty md:text-4xl lg:text-5xl",
    h2: "w-full text-foreground text-3xl font-black leading-[1.05] tracking-[-0.04em] text-pretty md:text-4xl lg:text-5xl",
  },

  levelHero:
    "max-w-3xl text-5xl font-black leading-[1] tracking-[-0.075em] text-balance md:text-6xl lg:text-7xl",

  subtitleHero:
    "max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl",

  separatorHero: "bg-primary",

  highlight:
    "inline-block bg-gradient-to-r from-primary via-primary/80 to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-highlight-shift",
} as const;
