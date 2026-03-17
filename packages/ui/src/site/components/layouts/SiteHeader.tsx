"use client";

/**
 * @file packages/ui/src/site/components/layouts/SiteHeader.tsx
 * @layer ui/site/components
 *
 * @description
 * Header site : logo/titre (identity) + navigation principale (primaryMenu) + menu social optionnel.
 *
 * @remarks
 * - Le rendu est piloté par `HeaderSettingsShape` (sticky, blur, swap, flags show*).
 * - Rend un header minimal si aucun élément n’est affichable (logo, titre, menu, social),
 *   afin de conserver le noeud DOM (mesure/ref/observer/etc.).
 * - Le style est fourni par le skin/template via `ui`.
 *
 * @accessibility
 * - Le composant rend un landmark `<header>`.
 * - Inclut un skip-link (visible au focus) pour aller au contenu principal.
 */

import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { useHeaderHeightVar } from "@compoz/ui/hooks/useHeaderHeightVar";
import { cn } from "@compoz/ui/lib/utils";
import { SiteLogo } from "@compoz/ui/site/components/atoms/SiteLogo";
import { SiteMobileMenu } from "@compoz/ui/site/components/molecules/SiteMobileMenu";
import { SiteHeaderNav } from "@compoz/ui/site/components/organisms/SiteHeaderNav";
import type { SiteHeaderUi } from "@compoz/ui/site/site-ui.types";

export type SiteHeaderProps = Readonly<{
  header: HeaderSettingsShape;
  identity: IdentitySettingsShape;
  primaryMenu: PrimaryMenuSettingsShape;
  social: SocialSettingsShape;
  ui: SiteHeaderUi;
}>;

export function SiteHeader({
  header,
  identity,
  primaryMenu,
  social,
  ui,
}: SiteHeaderProps) {
  const { sticky, blur, swapPrimaryAndSocial, showLogo, showSiteName } = header;

  const headerRef = useHeaderHeightVar();

  const hasLogo = showLogo && Boolean(identity.logoUrl);
  const hasSiteName = showSiteName && Boolean(identity.siteName);
  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;
  const hasVisibleContent = hasLogo || hasSiteName || hasMenu || hasSocial;

  const blurClassName = blur ? ui.header.blur : undefined;

  if (!hasVisibleContent) {
    return (
      <header ref={headerRef} className={cn(ui.header.base)}>
        <a href="#main-content" className={cn(ui.skipLink)}>
          Aller au contenu
        </a>
      </header>
    );
  }

  return (
    <header
      ref={headerRef}
      className={cn(ui.header.base, sticky && ui.header.sticky, blurClassName)}
    >
      <a href="#main-content" className={cn(ui.skipLink)}>
        Aller au contenu
      </a>

      <div className={cn(ui.headerContainer)}>
        <div className={cn(ui.logoSlot)}>
          {hasLogo ? <SiteLogo identity={identity} ui={ui.logo} /> : null}
          {hasSiteName ? (
            <span className={cn(ui.siteNameText)}>{identity.siteName}</span>
          ) : null}
        </div>

        <div className="hidden md:block">
          <SiteHeaderNav
            primaryMenu={primaryMenu}
            social={social}
            blurClassName={blurClassName}
            className={cn(ui.nav)}
            primaryMenuUi={ui.menu}
            socialMenuUi={ui.social}
            swapPrimaryAndSocial={swapPrimaryAndSocial}
          />
        </div>

        <div className="md:hidden">
          <SiteMobileMenu
            primaryMenu={primaryMenu}
            social={social}
            ui={ui.mobileMenu}
            ariaLabel="Menu principal"
            emptyLabel="Menu vide"
          />
        </div>
      </div>
    </header>
  );
}

SiteHeader.displayName = "SiteHeader";
