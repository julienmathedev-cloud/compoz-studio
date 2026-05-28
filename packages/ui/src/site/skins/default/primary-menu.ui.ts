/**
 * @file packages/ui/src/site/skins/default/primary-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu principal site (thème Default).
 */

import type { SitePrimaryMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultPrimaryMenuUi: SitePrimaryMenuUi = {
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4",

  item: "shrink-0",

  interactive: "inline-flex cursor-pointer items-center",

  link: "inline-flex cursor-pointer text-foreground px-2 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-4 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-4",

  label: "",

  dropdownPanel:
    "z-[80] rounded-md border border-border bg-background/75 p-2 shadow-md supports-[backdrop-filter]:bg-background/65 supports-[backdrop-filter]:backdrop-blur-xl",
} as const;
