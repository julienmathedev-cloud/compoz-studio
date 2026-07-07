/**
 * @file packages/ui/src/site/skins/portfolio/header.ui.ts
 * @layer ui/site/skins/portfolio
 *
 * @description
 * Defines the portfolio skin overrides for the public site header.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioPrimaryMenuUi } from "@compoz/ui/site/skins/portfolio/primary-menu.ui";
import { portfolioSocialMenuUi } from "@compoz/ui/site/skins/portfolio/social-menu.ui";

export const portfolioHeaderUi: SiteHeaderUiOverride = {
  header: {
    blur: "supports-[backdrop-filter]:bg-chrome/75 supports-[backdrop-filter]:backdrop-blur-md",
  },
  menu: portfolioPrimaryMenuUi,
  social: portfolioSocialMenuUi,
};
