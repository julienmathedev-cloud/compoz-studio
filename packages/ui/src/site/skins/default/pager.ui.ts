/**
 * @file packages/ui/src/site/skins/default/pager.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — pager site (thème Default).
 */

import type { SiteDetailPagerUi } from "@compoz/ui/site/site-ui.types";

export const defaultPagerUi: SiteDetailPagerUi = {
  nav: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 flex flex-col gap-3 md:flex-row md:justify-between py-4",

  // ✅ PRM : transition uniquement si motion autorisé
  link: "inline-flex items-center gap-2 rounded-md text-base md:text-lg lg:text-xl font-semibold leading-tight motion-safe:transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  label: "line-clamp-2",
  icon: "shrink-0",
} as const;
