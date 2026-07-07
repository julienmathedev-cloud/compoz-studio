/**
 * @file packages/ui/src/site/skins/default/cells/heading-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for heading cells.
 */

import type { SiteHeadingUi } from "@compoz/ui/site/site-ui.types";

export const defaultHeadingUi: SiteHeadingUi = {
  container: "flex flex-col gap-4",
  containerHero: "gap-6 md:gap-8",

  level: {
    h1: "text-foreground text-4xl font-bold tracking-tight",
    h2: "text-foreground text-3xl font-bold tracking-tight",
    h3: "text-foreground text-2xl font-semibold",
    h4: "text-foreground text-xl font-semibold",
    h5: "text-foreground text-lg font-semibold",
    h6: "text-foreground text-base font-semibold",
  },

  levelHero:
    "max-w-3xl text-5xl font-bold tracking-tight text-balance md:text-6xl",

  subtitle: "max-w-prose text-base text-muted-foreground",
  subtitleHero: "max-w-prose text-lg text-muted-foreground md:text-xl",

  separator: "w-1/3 bg-border",
  separatorHero: "w-1/4 bg-border",

  highlight: "text-primary",
} as const;
