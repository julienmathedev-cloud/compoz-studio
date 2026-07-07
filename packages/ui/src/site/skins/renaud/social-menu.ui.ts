/**
 * @file packages/ui/src/site/skins/renaud/social-menu.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Defines the Renaud skin overrides for the public site social menu.
 */

import type { SiteSocialMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudSocialMenuUi: SiteSocialMenuUiOverride = {
  link: "text-current/85 hover:text-current",
} as const;
