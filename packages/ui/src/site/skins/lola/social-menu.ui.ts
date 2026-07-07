/**
 * @file packages/ui/src/site/skins/lola/social-menu.ui.ts
 * @layer ui/site/skins/lola
 *
 * @description
 * Defines the Lola skin overrides for the public site social menu.
 */

import type { SiteSocialMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaSocialMenuUi: SiteSocialMenuUiOverride = {
  interactive:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:translate-y-[-1px] motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",

  link: "text-current/85 hover:text-current motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
} as const;
