/**
 * @file packages/ui/src/site/skins/lola/pager.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — preview overview site (thème Lola).
 */

import type { SiteDetailPagerUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaPagerUi: SiteDetailPagerUiOverride = {
  nav: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 flex flex-col gap-4 md:flex-row md:justify-between py-4",

  link: "inline-flex items-center gap-2 rounded-md text-base md:text-lg lg:text-xl font-bold leading-tight motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out hover:opacity-80 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
} as const;
