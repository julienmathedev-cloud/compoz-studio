/**
 * @file packages/ui/src/site/skins/renaud/cells/heading-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — heading cell (site Meca A Dom 34).
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudHeadingUi: SiteHeadingUiOverride = {
  level: {
    h2: "text-4xl font-extrabold leading-[0.95] tracking-[-0.045em]",
  },
  levelHero:
    "leading-[0.95] tracking-[-0.045em] font-extrabold text-5xl md:text-6xl lg:text-7xl",

  // subtitle: "max-w-prose text-base text-current/85",

  // subtitleHero: "max-w-prose text-lg text-current/85 md:text-xl",

  // separator: "w-1/3 bg-current/20",

  // separatorHero: "w-1/4 bg-current/20",
} as const;
