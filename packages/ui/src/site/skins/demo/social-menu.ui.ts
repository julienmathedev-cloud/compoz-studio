/**
 * @file packages/ui/src/site/skins/demo/social-menu.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Defines the demo skin overrides for the public site social menu.
 */

import type { SiteSocialMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoSocialMenuUi: SiteSocialMenuUiOverride = {
  interactive:
    "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",
} as const;
