/**
 * @file packages/ui/src/site/skins/default/header.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI par défaut pour styler l'en-tête du site (thème Default).
 *
 * @remarks
 * - Header sobre, basé sur `bg-chrome` + blur pour différenciation.
 * - Aucun token custom hors thème public.
 * - La hauteur est pilotée par le container (padding), pas par le header.
 */

import type { SiteHeaderUi } from "@compoz/ui/site/site-ui.types";
import { defaultLogoUi } from "@compoz/ui/site/skins/default/logo.ui";
import { defaultMobileMenuUi } from "@compoz/ui/site/skins/default/mobile-menu.ui";
import { defaultPrimaryMenuUi } from "@compoz/ui/site/skins/default/primary-menu.ui";
import { defaultSocialMenuUi } from "@compoz/ui/site/skins/default/social-menu.ui";

export const defaultHeaderUi: SiteHeaderUi = {
  header: {
    /**
     * Structure de base du header.
     *
     * - `bg-chrome` : surface structurelle header/footer
     * - `border-b` : séparation légère avec le contenu
     * - transition douce pour les changements de thème
     */
    base: "border-b border-border bg-chrome motion-safe:transition-colors motion-safe:duration-200",

    /**
     * Mode sticky.
     */
    sticky: "sticky top-0 z-50",

    /**
     * Effet blur (si activé côté settings).
     *
     * - opacité légèrement réduite pour laisser passer le contenu
     * - blur pour lisibilité
     */
    blur: "supports-[backdrop-filter]:bg-chrome/75 supports-[backdrop-filter]:backdrop-blur-md",
  },

  /**
   * Container interne du header.
   *
   * - largeur limitée
   * - padding horizontal responsive
   * - padding vertical pour gérer la hauteur réelle
   */
  headerContainer:
    "mx-auto flex max-w-screen-xl items-center justify-between px-2 py-1 md:px-4 md:py-2",

  /**
   * Skip link accessibilité.
   */
  skipLink:
    "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] rounded-md bg-background px-3 py-2 text-foreground shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",

  /**
   * Slot logo + nom.
   */
  logoSlot: "flex items-center gap-2 md:gap-3 lg:gap-4",

  /**
   * Texte du nom du site.
   */
  siteNameText: "text-lg md:text-2xl font-bold tracking-tight text-foreground",

  /**
   * Navigation desktop.
   */
  nav: "inline-flex items-center gap-2 md:gap-3 lg:gap-4",

  logo: defaultLogoUi,
  mobileMenu: defaultMobileMenuUi,
  menu: defaultPrimaryMenuUi,
  social: defaultSocialMenuUi,
};
