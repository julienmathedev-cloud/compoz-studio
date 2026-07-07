/**
 * @file packages/ui/src/site/skins/demo/header.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Defines the demo skin overrides for the public site header.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoLogoUi } from "@compoz/ui/site/skins/demo/logo.ui";
import { demoMobileMenuUi } from "@compoz/ui/site/skins/demo/mobile-menu.ui";
import { demoPrimaryMenuUi } from "@compoz/ui/site/skins/demo/primary-menu.ui";
import { demoSocialMenuUi } from "@compoz/ui/site/skins/demo/social-menu.ui";

export const demoHeaderUi: SiteHeaderUiOverride = {
  header: {
    blur: "supports-[backdrop-filter]:bg-chrome/75 supports-[backdrop-filter]:backdrop-blur-md",
  },
  logo: demoLogoUi,
  mobileMenu: demoMobileMenuUi,
  menu: demoPrimaryMenuUi,
  social: demoSocialMenuUi,
};
