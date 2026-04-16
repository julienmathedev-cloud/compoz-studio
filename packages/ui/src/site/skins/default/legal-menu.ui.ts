/**
 * @file packages/ui/src/site/skins/default/legal-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu légal site (thème Default).
 */

import type { SiteLegalMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultLegalMenuUi: SiteLegalMenuUi = {
  nav: "justify-self-center lg:col-start-3 lg:justify-self-end py-1 md:py-2",

  list: "m-0 flex list-none flex-wrap items-center p-0 gap-2 md:gap-3 lg:gap-4",

  item: "shrink-0",

  interactive: "inline-flex items-center",

  link: "inline-flex text-muted-foreground no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-4 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-4",
} as const;
