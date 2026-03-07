/**
 * @file packages/ui/src/site/skins/default/primary-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu principal site (thème Default).
 */

import type { SitePrimaryMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultPrimaryMenuUi: SitePrimaryMenuUi = {
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-4 md:gap-6",

  item: "shrink-0",

  // ✅ PRM : transition + hover uniquement si motion autorisé
  interactive:
    "inline-flex items-center motion-safe:transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-90",

  link: "inline-flex rounded-md px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-4 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-4",

  dropdownPanel:
    "z-[80] p-2 rounded-md border border-border bg-background shadow-sm",
} as const;
