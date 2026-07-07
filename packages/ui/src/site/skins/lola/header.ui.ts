/**
 * @file packages/ui/src/site/skins/lola/header.ui.ts
 * @layer ui/site/skins/lola
 *
 * @description
 * Defines the Lola skin overrides for the public site header.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";

import { lolaPrimaryMenuUi } from "@compoz/ui/site/skins/lola/primary-menu.ui";
import { lolaSocialMenuUi } from "@compoz/ui/site/skins/lola/social-menu.ui";

export const lolaHeaderUi: SiteHeaderUiOverride = {
  menu: lolaPrimaryMenuUi,
  social: lolaSocialMenuUi,
} as const;
