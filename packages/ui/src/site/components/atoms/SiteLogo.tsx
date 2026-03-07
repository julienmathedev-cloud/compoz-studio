"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteLogo.tsx
 * @layer ui/site/components
 *
 * @description
 * Atome site : logo cliquable (SiteAppImage + Next/Link) avec garde-fous a11y et UI injectée.
 *
 * @remarks
 * - Rend `null` si `identity.logoUrl` est vide.
 * - A11y :
 *   - Le lien porte un nom accessible (`aria-label`), l’image est décorative (`alt=""`).
 * - Preview iframe : logo non cliquable.
 * - Convention V0.5 : plus de querystring `state` (draft/published via routes dédiées).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resolveInternalHref,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import type { SiteLogoUi } from "@compoz/ui/site/site-ui.types";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";

export type SiteLogoProps = Readonly<{
  /** Settings d’identité (source de vérité UI pour le logo). */
  identity: IdentitySettingsShape;
  /** Optionnel : classes UI injectées par le skin/template. */
  ui: SiteLogoUi;
}>;

export function SiteLogo({ identity, ui }: SiteLogoProps) {
  const logoUrl = normalizeString(identity.logoUrl);
  const pathname = usePathname() || "/";

  if (!logoUrl) return null;

  const disableAllLinks = shouldDisableLinksInPreview(pathname);
  const homeHref = resolveInternalHref(pathname, "/");

  // variables par défaut
  const ariaLabel = normalizeString(identity.siteName) || "Accueil";
  const width = 240;
  const height = 60;

  const logoImage = (
    <SiteAppImage
      image={{
        src: logoUrl,
        alt: "", // décoratif (le lien porte le label)
        width,
        height,
      }}
      priority={false} // <- important
      fetchPriority="low"
      // logo = élément header, on évite les surprises : taille stable + décodage auto
      sizes="240px"
      className={cn(ui.image)}
    />
  );

  // ✅ Preview : logo non cliquable
  if (disableAllLinks) {
    return (
      <span
        className={cn(ui.link, "cursor-default")}
        aria-disabled="true"
        data-disabled="true"
      >
        {logoImage}
      </span>
    );
  }

  return (
    <Link href={homeHref} aria-label={ariaLabel} className={cn(ui.link)}>
      {logoImage}
    </Link>
  );
}

SiteLogo.displayName = "SiteLogo";
