/**
 * @file packages/ui/src/site/components/organisms/SiteHeaderNav.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders the public site header navigation landmark with primary and optional social menus.
 *
 * @remarks
 * Keeps a single `nav` landmark while allowing the skin settings to swap primary and social menu order.
 */

import { cn } from "@compoz/ui/lib/utils";
import { SiteSocialMenu } from "@compoz/ui/site/components/molecules/SiteSocialMenu";
import { SitePrimaryMenu } from "@compoz/ui/site/components/organisms/SitePrimaryMenu";

import type {
  SitePrimaryMenuUi,
  SiteSocialMenuUi,
} from "@compoz/ui/site/site-ui.types";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

export type SiteHeaderNavProps = Readonly<{
  primaryMenu: PrimaryMenuSettingsShape;
  social?: SocialSettingsShape;
  className?: string;
  primaryMenuUi: SitePrimaryMenuUi;
  socialMenuUi: SiteSocialMenuUi;
  swapPrimaryAndSocial?: boolean;
}>;

export function SiteHeaderNav({
  primaryMenu,
  social,
  className,
  primaryMenuUi,
  socialMenuUi,
  swapPrimaryAndSocial,
}: SiteHeaderNavProps) {
  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;

  if (!hasMenu && !hasSocial) {
    return null;
  }

  const primary = hasMenu ? (
    <SitePrimaryMenu settings={primaryMenu} ui={primaryMenuUi} />
  ) : null;

  const socials = hasSocial ? (
    <SiteSocialMenu settings={social} ui={socialMenuUi} />
  ) : null;

  const shouldSwap = Boolean(swapPrimaryAndSocial);

  return (
    <nav aria-label="Navigation principale" className={cn(className)}>
      {shouldSwap ? (
        <>
          {socials}
          {primary}
        </>
      ) : (
        <>
          {primary}
          {socials}
        </>
      )}
    </nav>
  );
}

SiteHeaderNav.displayName = "SiteHeaderNav";
