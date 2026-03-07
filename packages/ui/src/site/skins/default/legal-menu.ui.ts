/**
 * @file packages/ui/src/site/skins/default/legal-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu légal site (thème Default).
 */

import type { SiteLegalMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultLegalMenuUi: SiteLegalMenuUi = {
  nav: "justify-self-center lg:col-start-3 lg:justify-self-end",

  list: "m-0 p-0 list-none flex flex-wrap gap-4 md:gap-6",

  item: "shrink-0",

  interactive: "inline-flex",

  // ✅ PRM : transition uniquement si motion autorisé
  link: "text-muted-foreground px-2 py-1 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-90 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-4 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-4",
} as const;
