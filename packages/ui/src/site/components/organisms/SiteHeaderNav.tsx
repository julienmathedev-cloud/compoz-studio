"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteHeaderNav.tsx
 * @layer ui/site/organisms
 *
 * @description
 * Organism site : navigation du header (primary + social).
 *
 * @remarks
 * - Rend un seul landmark `<nav>`.
 * - Compose `SitePrimaryMenu` et `SiteSocialMenu`.
 * - Gère l’ordre via `swapPrimaryAndSocial`.
 * - UI entièrement pilotée par le skin.
 */

import { cn } from "@compoz/ui/lib/utils";
import { SiteSocialMenu } from "@compoz/ui/site/components/molecules/SiteSocialMenu";
import { SitePrimaryMenu } from "@compoz/ui/site/components/organisms/SitePrimaryMenu";

import type {
  SitePrimaryMenuUi,
  SiteSocialMenuUi,
} from "@compoz/ui/site/site-ui.types.ts";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

export type SiteHeaderNavProps = Readonly<{
  primaryMenu: PrimaryMenuSettingsShape;
  social?: SocialSettingsShape;
  blurClassName?: string;
  className?: string;
  primaryMenuUi: SitePrimaryMenuUi;
  socialMenuUi: SiteSocialMenuUi;
  swapPrimaryAndSocial?: boolean;
}>;

export function SiteHeaderNav({
  primaryMenu,
  social,
  blurClassName,
  className,
  primaryMenuUi,
  socialMenuUi,
  swapPrimaryAndSocial,
}: SiteHeaderNavProps) {
  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;

  if (!hasMenu && !hasSocial) return null;

  const primary = hasMenu ? (
    <SitePrimaryMenu
      settings={primaryMenu}
      ui={primaryMenuUi}
      blurClassName={blurClassName}
    />
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
