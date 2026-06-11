/**
 * @file packages/ui/src/site/skins/portfolio/social-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu social site (thème Portfolio).
 */

import type { SiteSocialMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioSocialMenuUi: SiteSocialMenuUiOverride = {
  interactive:
    "justify-center whitespace-nowrap rounded-md shrink-0 disabled:pointer-events-none disabled:opacity-50 group text-sm font-normal motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:translate-y-[-1px] motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.96] motion-safe:hover:opacity-100",

  link: "px-2 py-2 hover:text-primary group",
} as const;
