/**
 * @file packages/ui/src/site/skins/default/social-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu social site (thème Default).
 */

import type { SiteSocialMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultSocialMenuUi: SiteSocialMenuUi = {
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4",

  item: "shrink-0",

  interactive:
    "inline-flex items-center cursor-pointer motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:opacity-90 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",

  // ✅ PRM : transition + hover uniquement si motion autorisé
  link: "inline-flex text-foreground items-center justify-center p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  icon: "h-5 w-5",
} as const;
