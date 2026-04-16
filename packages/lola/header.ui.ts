/**
 * @file packages/ui/src/site/skins/lola/header.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — header site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Compose les skins des sous-composants (logo, menu, social).
 * - Consommé par `SiteHeader` via la prop `ui`.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";

import { lolaLogoUi } from "@compoz/ui/site/skins/lola/logo.ui";
import { lolaMobileMenuUi } from "@compoz/ui/site/skins/lola/mobile-menu.ui";
import { lolaPrimaryMenuUi } from "@compoz/ui/site/skins/lola/primary-menu.ui";
import { lolaSocialMenuUi } from "@compoz/ui/site/skins/lola/social-menu.ui";

export const lolaHeaderUi: SiteHeaderUiOverride = {
  header: {
    base: "border-b border-zinc-100 bg-white motion-safe:transition-colors motion-safe:duration-300 min-h-[50px]",
    blur: "supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
  },

  nav: "inline-flex items-center gap-4 md:gap-7 lg:gap-10",

  logo: lolaLogoUi,
  mobileMenu: lolaMobileMenuUi,
  menu: lolaPrimaryMenuUi,
  social: lolaSocialMenuUi,
} as const;
