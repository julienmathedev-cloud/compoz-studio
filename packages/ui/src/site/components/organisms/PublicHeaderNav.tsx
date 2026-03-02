"use client";

/**
 * @file packages/ui/src/site/components/organisms/PublicHeaderNav.tsx
 * @layer ui/public/organisms
 *
 * @description
 * Organism public : navigation du header (primary + social).
 *
 * @remarks
 * - Rend un seul landmark `<nav>`.
 * - Compose `PublicPrimaryMenu` et `PublicSocialMenu`.
 * - Gère l’ordre via `swapPrimaryAndSocial`.
 * - UI entièrement pilotée par le skin.
 */

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";
import { cn } from "@compoz/ui/lib/utils";
import { PublicSocialMenu } from "@compoz/ui/site/components/molecules/PublicSocialMenu";
import { PublicPrimaryMenu } from "@compoz/ui/site/components/organisms/PublicPrimaryMenu";
import type {
  PublicPrimaryMenuUi,
  PublicSocialMenuUi,
} from "@compoz/ui/site/public-ui.types";

export type PublicHeaderNavProps = Readonly<{
  primaryMenu: PrimaryMenuSettingsShape;
  social?: SocialSettingsShape;
  blurClassName?: string;
  className?: string;
  primaryMenuUi: PublicPrimaryMenuUi;
  socialMenuUi: PublicSocialMenuUi;
  swapPrimaryAndSocial?: boolean;
}>;

export function PublicHeaderNav({
  primaryMenu,
  social,
  blurClassName,
  className,
  primaryMenuUi,
  socialMenuUi,
  swapPrimaryAndSocial,
}: PublicHeaderNavProps) {
  const hasMenu = (primaryMenu.items?.length ?? 0) > 0;
  const hasSocial = (social?.items?.length ?? 0) > 0;

  if (!hasMenu && !hasSocial) return null;

  const primary = hasMenu ? (
    <PublicPrimaryMenu
      settings={primaryMenu}
      ui={primaryMenuUi}
      blurClassName={blurClassName}
    />
  ) : null;

  const socials = hasSocial ? (
    <PublicSocialMenu settings={social} ui={socialMenuUi} />
  ) : null;

  return (
    <nav aria-label="Navigation principale" className={cn(className)}>
      {swapPrimaryAndSocial ? (
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

PublicHeaderNav.displayName = "PublicHeaderNav";
