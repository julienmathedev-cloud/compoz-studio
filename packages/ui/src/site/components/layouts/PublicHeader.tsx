"use client";

/**
 * @file packages/ui/src/site/components/layouts/PublicHeader.tsx
 * @layer ui/public/layouts
 *
 * @description
 * Header public : logo/titre (identity) + navigation principale (primaryMenu) + menu social optionnel.
 *
 * @remarks
 * - Le rendu est piloté par `HeaderSettingsShape` (sticky, blur, swap, flags show*).
 * - Rend `null` si aucun élément n’est affichable (logo, titre, menu, social).
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
import { PublicLogo } from "@compoz/ui/site/components/atoms/PublicLogo";
import { PublicMobileMenu } from "@compoz/ui/site/components/molecules/PublicMobileMenu";
import { PublicHeaderNav } from "@compoz/ui/site/components/organisms/PublicHeaderNav";
import type { PublicHeaderUi } from "@compoz/ui/site/public-ui.types";

export type PublicHeaderProps = Readonly<{
  header: HeaderSettingsShape;
  identity: IdentitySettingsShape;
  primaryMenu: PrimaryMenuSettingsShape;
  social: SocialSettingsShape;
  ui: PublicHeaderUi;
}>;

export function PublicHeader({
  header,
  identity,
  primaryMenu,
  social,
  ui,
}: PublicHeaderProps) {
  const { sticky, blur, swapPrimaryAndSocial, showLogo, showSiteName } = header;

  // (2) Hauteur de header → variable CSS (sticky/layout)
  const headerRef = useHeaderHeightVar();

  const hasLogo = showLogo && Boolean(identity.logoUrl);
  const hasSiteName = showSiteName && Boolean(identity.siteName);

  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;

  // Rien à afficher : pas de header.
  if (!hasLogo && !hasSiteName && !hasMenu && !hasSocial) {
    // ✅ Header "vide" : on garde un noeud DOM pour éviter les crashs (mesure/ref/observer/etc.)
    return (
      <header ref={headerRef} className={cn(ui.header.base)}>
        {/* ✅ Skip link (visible au focus clavier) */}
        <a href="#main-content" className={cn(ui.skipLink)}>
          Aller au contenu
        </a>
      </header>
    );
  }

  const blurClassName = blur ? ui.header.blur : "";

  const logoContent = (
    <div className={cn(ui.logoSlot)}>
      {hasLogo && <PublicLogo identity={identity} ui={ui.logo} />}
      {hasSiteName ? (
        <span className={cn(ui.siteNameText)}>{identity.siteName}</span>
      ) : null}
    </div>
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        // Sticky piloté par settings.
        sticky && ui.header.sticky,

        // Blur piloté par settings (classes fournies par le skin).
        blurClassName,
        ui.header.base,
      )}
    >
      {/* ✅ Skip link (visible au focus clavier) */}
      <a href="#main-content" className={cn(ui.skipLink)}>
        Aller au contenu
      </a>

      <div className={cn(ui.headerContainer)}>
        {logoContent}

        <>
          {/* Nav desktop */}
          <div className="hidden md:block">
            <PublicHeaderNav
              primaryMenu={primaryMenu}
              social={social}
              blurClassName={blurClassName}
              className={cn(ui.nav)}
              primaryMenuUi={ui.menu}
              socialMenuUi={ui.social}
              swapPrimaryAndSocial={swapPrimaryAndSocial}
            />
          </div>

          {/* Nav mobile */}
          <div className="md:hidden">
            <PublicMobileMenu
              primaryMenu={primaryMenu}
              social={social}
              ui={ui.mobileMenu}
              ariaLabel="Menu principal"
              emptyLabel="Menu vide" // optionnel
            />
          </div>
        </>
      </div>
    </header>
  );
}

PublicHeader.displayName = "PublicHeader";
