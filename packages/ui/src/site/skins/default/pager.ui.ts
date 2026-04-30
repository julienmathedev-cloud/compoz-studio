/**
 * @file packages/ui/src/site/skins/default/pager.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — pager site (thème Default).
 */

import type { SiteDetailPagerUi } from "@compoz/ui/site/site-ui.types";

export const defaultPagerUi: SiteDetailPagerUi = {
  nav: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 flex flex-row flex-wrap items-center justify-between gap-3 py-4 mt-auto",

  link: "rounded-md text-base md:text-lg lg:text-xl font-semibold leading-tight motion-safe:transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  wrapper: "inline-flex items-center gap-2",
  label: "line-clamp-2",
  icon: "shrink-0",
} as const;
