/**
 * @file packages/ui/src/site/skins/default/header.ui.ts
 * @module ui/public/skins
 *
 * @description
 * Skin UI par defaut pour styler l'en-tête du site public (thème Default).
 */

import type { PublicHeaderUi } from "@compoz/ui/site/public-ui.types";
import { defaultLogoUi } from "@compoz/ui/site/skins/default/logo.ui";
import { defaultMobileMenuUi } from "@compoz/ui/site/skins/default/mobile-menu.ui";
import { defaultPrimaryMenuUi } from "@compoz/ui/site/skins/default/primary-menu.ui";
import { defaultSocialMenuUi } from "@compoz/ui/site/skins/default/social-menu.ui";

export const defaultHeaderUi: PublicHeaderUi = {
  header: {
    // ✅ PRM : transition couleur uniquement si motion autorisé
    base: "border-b border-border bg-background motion-safe:transition-colors motion-safe:duration-300 min-h-[50px]",
    sticky: "sticky top-0 z-50",
    blur: "supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
  },
  headerContainer:
    "mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 flex items-center justify-between py-2 md:py-3 lg:py-4",
  skipLink:
    "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] rounded-md px-3 py-2 bg-background text-foreground shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  logoSlot: "flex items-center gap-2",
  siteNameText: "text-sm font-medium text-foreground/80 leading-none",
  nav: "inline-flex items-center gap-4 md:gap-6",
  logo: defaultLogoUi,
  mobileMenu: defaultMobileMenuUi,
  menu: defaultPrimaryMenuUi,
  social: defaultSocialMenuUi,
};
