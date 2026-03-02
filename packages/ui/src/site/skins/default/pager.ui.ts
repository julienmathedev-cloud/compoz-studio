/**
 * @file packages/ui/src/site/skins/default/pager.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — pager public (thème Default).
 */

import type { PublicDetailPagerUi } from "@compoz/ui/site/public-ui.types";

export const defaultPagerUi: PublicDetailPagerUi = {
  nav: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 flex flex-col gap-3 md:flex-row md:justify-between py-4",

  // ✅ PRM : transition uniquement si motion autorisé
  link: "inline-flex items-center gap-2 rounded-md text-base md:text-lg lg:text-xl font-semibold leading-tight motion-safe:transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  label: "line-clamp-2",
  icon: "shrink-0",
} as const;
