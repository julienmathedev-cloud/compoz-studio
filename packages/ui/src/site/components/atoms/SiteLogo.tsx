/**
 * @file packages/ui/src/site/components/atoms/SiteLogo.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : logo cliquable ou désactivé selon le contexte parent.
 */

import Link from "next/link";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import type { SiteLogoUi } from "@compoz/ui/site/site-ui.types";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";

export type SiteLogoProps = Readonly<{
  identity: IdentitySettingsShape;
  ui: SiteLogoUi;
  href?: string;
  disabled?: boolean;
}>;

export function SiteLogo({
  identity,
  ui,
  href = "/",
  disabled = false,
}: SiteLogoProps) {
  const logo = identity.logo;

  if (!logo || !normalizeString(logo.src)) {
    return null;
  }

  const ariaLabel = normalizeString(identity.siteName) || "Accueil";

  const logoImage = (
    <SiteAppImage
      image={{
        src: logo.src,
        alt: "",
        width: logo.width,
        height: logo.height,
      }}
      fetchPriority="auto"
      sizes={ui.sizes}
      className={cn(ui.image)}
    />
  );

  if (disabled) {
    return (
      <span
        className={cn(ui.link, "cursor-pointer")}
        aria-disabled="true"
        data-disabled="true"
      >
        {logoImage}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(ui.link)}
      scroll={false}
    >
      {logoImage}
    </Link>
  );
}

SiteLogo.displayName = "SiteLogo";
