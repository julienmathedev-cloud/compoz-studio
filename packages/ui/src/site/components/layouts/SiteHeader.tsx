/**
 * @file packages/ui/src/site/components/layouts/SiteHeader.tsx
 * @layer ui/site/components/layouts
 *
 * @description
 * Renders the public site header with identity, primary navigation, and optional social navigation.
 *
 * @remarks
 * Keeps a minimal header DOM node when no content is visible so height sync and observers can still run; includes the main-content skip link.
 */

import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { SiteHeaderHeightSync } from "@compoz/ui/site/components/atoms/SiteHeaderHeightSync";
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
  logoDisabled?: boolean;
}>;

export function SiteHeader({
  header,
  identity,
  primaryMenu,
  social,
  ui,
  logoDisabled = false,
}: SiteHeaderProps) {
  const { sticky, blur, swapPrimaryAndSocial, showLogo, showSiteName } = header;

  const logoSrc = identity.logo?.src?.trim() ?? "";
  const hasLogo = showLogo && logoSrc.length > 0;
  const hasSiteName = showSiteName && Boolean(identity.siteName);
  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;
  const hasVisibleContent = hasLogo || hasSiteName || hasMenu || hasSocial;

  const blurClassName = blur ? ui.header.blur : undefined;

  if (!hasVisibleContent) {
    return (
      <header data-site-header className={cn(ui.header.base)}>
        <SiteHeaderHeightSync />
        <a href="#main-content" className={cn(ui.skipLink)}>
          Aller au contenu
        </a>
      </header>
    );
  }

  return (
    <header
      data-site-header
      className={cn(ui.header.base, sticky && ui.header.sticky, blurClassName)}
    >
      <SiteHeaderHeightSync />
      <a href="#main-content" className={cn(ui.skipLink)}>
        Aller au contenu
      </a>

      <div className={cn(ui.headerContainer)}>
        <div className={cn(ui.logoSlot)}>
          {hasLogo ? (
            <SiteLogo
              identity={identity}
              ui={ui.logo}
              href="/"
              disabled={logoDisabled}
            />
          ) : null}
          {hasSiteName ? (
            <span className={cn(ui.siteNameText)}>{identity.siteName}</span>
          ) : null}
        </div>

        <div className="hidden md:block">
          <SiteHeaderNav
            primaryMenu={primaryMenu}
            social={social}
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
