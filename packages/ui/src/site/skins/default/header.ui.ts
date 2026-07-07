/**
 * @file packages/ui/src/site/skins/default/header.ui.ts
 * @layer ui/site/skins/default
 *
 * @description
 * Defines the default skin classes for the public site header.
 */

import type { SiteHeaderUi } from "@compoz/ui/site/site-ui.types";
import { defaultLogoUi } from "@compoz/ui/site/skins/default/logo.ui";
import { defaultMobileMenuUi } from "@compoz/ui/site/skins/default/mobile-menu.ui";
import { defaultPrimaryMenuUi } from "@compoz/ui/site/skins/default/primary-menu.ui";
import { defaultSocialMenuUi } from "@compoz/ui/site/skins/default/social-menu.ui";

export const defaultHeaderUi: SiteHeaderUi = {
  header: {
    base: "border-b border-border bg-chrome motion-safe:transition-colors motion-safe:duration-200",
    sticky: "sticky top-0 z-50",
    blur: "supports-[backdrop-filter]:bg-chrome/90 supports-[backdrop-filter]:backdrop-blur-sm",
  },

  headerContainer:
    "mx-auto flex max-w-screen-xl items-center justify-between px-2 py-1 md:px-4 md:py-2",

  skipLink:
    "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] rounded-md bg-chrome px-3 py-2 text-foreground shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",

  logoSlot: "flex items-center gap-2 md:gap-3 lg:gap-4",

  siteNameText: "text-lg md:text-2xl font-bold tracking-tight text-foreground",

  nav: "inline-flex items-center gap-2 md:gap-3 lg:gap-4",

  logo: defaultLogoUi,
  mobileMenu: defaultMobileMenuUi,
  menu: defaultPrimaryMenuUi,
  social: defaultSocialMenuUi,
};
