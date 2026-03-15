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
  containerHero: "flex flex-col gap-6 pt-36 pb-10",

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

  levelHero: "text-5xl text-balance max-w-2xl",

  /* -------------------------------------------------------------------------- */
  /* Subtitle                                                                   */
  /* -------------------------------------------------------------------------- */

  subtitle: "text-muted-foreground text-base max-w-prose",
  subtitleHero: "text-lg",

  /* -------------------------------------------------------------------------- */
  /* Separator                                                                  */
  /* -------------------------------------------------------------------------- */

  separator: "",
  separatorHero: "w-[50vh] bg-primary",

  /* -------------------------------------------------------------------------- */
  /* Highlight                                                                  */
  /* -------------------------------------------------------------------------- */

  highlight:
    "bg-gradient-to-l from-primary to-primary/50 bg-clip-text text-transparent",
} as const;
