/**
 * @file packages/ui/src/site/skins/default/cells/heading-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — heading cell (thème Default).
 *
 * @remarks
 * Définit uniquement les styles Tailwind.
 * Aucune logique ici : le renderer gère align / level / variant.
 */

import type { SiteHeadingUi } from "@compoz/ui/site/site-ui.types";

export const defaultHeadingUi: SiteHeadingUi = {
  /* -------------------------------------------------------------------------- */
  /* Container                                                                  */
  /* -------------------------------------------------------------------------- */

  container: "flex flex-col gap-4",
  containerHero: "gap-6 md:gap-8",

  /* -------------------------------------------------------------------------- */
  /* Title                                                                      */
  /* -------------------------------------------------------------------------- */

  level: {
    h1: "text-4xl font-bold tracking-tight",
    h2: "text-3xl font-bold tracking-tight",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    h5: "text-lg font-semibold",
    h6: "text-base font-semibold",
  },

  levelHero:
    "max-w-3xl text-5xl font-bold tracking-tight text-balance md:text-6xl",

  /* -------------------------------------------------------------------------- */
  /* Subtitle                                                                   */
  /* -------------------------------------------------------------------------- */

  subtitle: "max-w-prose text-base text-muted-foreground",
  subtitleHero: "max-w-prose text-lg text-muted-foreground md:text-xl",

  /* -------------------------------------------------------------------------- */
  /* Separator                                                                  */
  /* -------------------------------------------------------------------------- */

  separator: "w-1/3 bg-border",
  separatorHero: "w-1/4 bg-primary",

  /* -------------------------------------------------------------------------- */
  /* Highlight                                                                  */
  /* -------------------------------------------------------------------------- */

  highlight:
    "bg-gradient-to-l from-primary to-primary/50 bg-clip-text text-transparent",
} as const;
