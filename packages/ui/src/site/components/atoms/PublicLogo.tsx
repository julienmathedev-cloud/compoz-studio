"use client";

/**
 * @file packages/ui/src/site/components/atoms/PublicLogo.tsx
 * @layer ui/public/atoms
 *
 * @description
 * Atome public : logo cliquable (PublicAppImage + Next/Link) avec garde-fous a11y et UI injectée.
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

import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import {
  resolveInternalHref,
  shouldDisableLinksInPreview,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { PublicAppImage } from "@compoz/ui/site/components/atoms/PublicAppImage";
import type { PublicLogoUi } from "@compoz/ui/site/public-ui.types";

export type PublicLogoProps = Readonly<{
  /** Settings d’identité (source de vérité UI pour le logo). */
  identity: IdentitySettingsShape;
  /** Optionnel : classes UI injectées par le skin/template. */
  ui: PublicLogoUi;
}>;

export function PublicLogo({ identity, ui }: PublicLogoProps) {
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
    <PublicAppImage
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

PublicLogo.displayName = "PublicLogo";
